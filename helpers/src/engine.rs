use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use anyhow::Context;
use napi::bindgen_prelude::*;
use napi_derive::napi;

use crate::model::{
    pick_axis, Axis, CartesianCoordinates, Country, ProjectedCountry, SphereCoordinates,
};

#[derive(Debug)]
struct KdTree {
    id: i16,
    coordinates: CartesianCoordinates,

    axis: Axis,

    left_child: Option<Box<KdTree>>,
    right_child: Option<Box<KdTree>>,
}

#[derive(Debug)]
#[napi(object)]
pub struct ProximityMatch {
    pub id: i16,
    pub dist: f64,
}

impl KdTree {
    fn build_from_list(country: Vec<Country>) -> Option<Self> {
        fn build_recursive(segment: &mut [ProjectedCountry]) -> Option<KdTree> {
            if segment.is_empty() {
                return None;
            }
            let axis = pick_axis(segment);
            segment.sort_unstable_by(|a, b| {
                a.coords
                    .get_axis(axis)
                    .partial_cmp(&b.coords.get_axis(axis))
                    .unwrap()
            });

            let (left, rest) = segment.split_at_mut(segment.len() / 2);
            let (mid, right) = rest.split_first_mut()?;

            Some(KdTree {
                id: mid.id,
                coordinates: mid.coords,

                axis,

                left_child: build_recursive(left).map(Box::new),
                right_child: build_recursive(right).map(Box::new),
            })
        }

        let mut projected: Vec<_> = country
            .into_iter()
            .map(ProjectedCountry::from_country)
            .collect();

        build_recursive(&mut projected)
    }

    fn proximity_search(&self, centre: CartesianCoordinates, radius: f64) -> Vec<ProximityMatch> {
        fn traverse_recursive(
            matches: &mut Vec<ProximityMatch>,
            node: &KdTree,
            centre: CartesianCoordinates,
            radius: f64,
        ) {
            let dist = (centre - node.coordinates).norm();
            if dist < radius {
                matches.push(ProximityMatch { id: node.id, dist });
            }

            let sep = node.coordinates.get_axis(node.axis);
            let proj = centre.get_axis(node.axis);

            if proj - sep < radius {
                if let Some(child) = &node.left_child {
                    traverse_recursive(matches, child, centre, radius);
                }
            }
            if sep - proj < radius {
                if let Some(child) = &node.right_child {
                    traverse_recursive(matches, child, centre, radius);
                }
            }
        }

        let mut matches: Vec<ProximityMatch> = Vec::new();
        traverse_recursive(&mut matches, self, centre, radius);

        matches
    }

    fn relax(
        &self,
        a: (i16, CartesianCoordinates),
        b: (i16, CartesianCoordinates),
        elasticity: f64,
    ) -> Option<(i16, CartesianCoordinates)> {
        struct Candidate {
            country: Option<(i16, CartesianCoordinates)>,
            dist: f64,
        }

        fn relax_recursive(
            node: &KdTree,
            a: (i16, CartesianCoordinates),
            b: (i16, CartesianCoordinates),
            elasticity: f64,
            candidate: &mut Candidate,
        ) {
            // exclude endpoints and require that the triangle spanned by the three points not be
            // obtuse so that there is no backtracking
            let an = node.coordinates - a.1;
            let bn = node.coordinates - b.1;
            let ab = b.1 - a.1;
            if node.id != a.0
                && node.id != b.0
                && an.dot(&ab).is_sign_positive()
                && bn.dot(&ab).is_sign_negative()
            {
                let dist = (a.1 - node.coordinates).gc_dist() + (node.coordinates - b.1).gc_dist();

                if dist < candidate.dist
                    || (candidate.country.is_none() && dist < candidate.dist * elasticity)
                {
                    candidate.country = Some((node.id, node.coordinates));
                    candidate.dist = dist;
                }
            }

            let sep = node.coordinates.get_axis(node.axis);

            if let Some(child) = &node.left_child {
                if a.1.get_axis(node.axis) <= sep || b.1.get_axis(node.axis) <= sep {
                    relax_recursive(child, a, b, elasticity, candidate);
                }
            }
            if let Some(child) = &node.right_child {
                if a.1.get_axis(node.axis) >= sep || b.1.get_axis(node.axis) >= sep {
                    relax_recursive(child, a, b, elasticity, candidate);
                }
            }
        }

        let mut candidate = Candidate {
            country: None,
            dist: (a.1 - b.1).gc_dist(),
        };
        relax_recursive(self, a, b, elasticity, &mut candidate);

        candidate.country
    }
}

#[allow(dead_code)]
#[derive(Debug)]
struct CountryInfo {
    id: i16,
    sphere: SphereCoordinates,
    cartesian: CartesianCoordinates,
}

impl std::convert::From<Country> for CountryInfo {
    fn from(country: Country) -> Self {
        CountryInfo {
            id: country.id,
            sphere: country.coordinates,
            cartesian: country.coordinates.into(),
        }
    }
}

#[derive(Debug)]
struct Route {
    start_id: i16,
    end_id: i16,
    start_coords: CartesianCoordinates,
    end_coords: CartesianCoordinates,

    next: Option<Box<Route>>,
}

#[allow(clippy::from_over_into)]
impl std::convert::Into<Vec<RouteStep>> for Route {
    fn into(self) -> Vec<RouteStep> {
        let mut result: Vec<RouteStep> = vec![(&self).into()];
        let mut current = self;
        while let Some(next) = current.next {
            current = *next;
            result.push((&current).into());
        }

        result
    }
}

#[derive(Debug)]
#[napi(object)]
pub struct RouteStep {
    pub start_id: i16,
    pub end_id: i16,
    pub dist: f64,
}

impl std::convert::From<&Route> for RouteStep {
    fn from(r: &Route) -> Self {
        Self {
            start_id: r.start_id,
            end_id: r.end_id,
            dist: (r.start_coords - r.end_coords).gc_dist(),
        }
    }
}

#[derive(Debug)]
struct MapQueryEngine {
    country_map: HashMap<i16, CountryInfo>,
    tree: KdTree,
}

impl MapQueryEngine {
    fn new(countries: Vec<Country>) -> Self {
        let tree = KdTree::build_from_list(countries.clone()).expect("k-d tree");
        let country_map: HashMap<i16, CountryInfo> =
            countries.into_iter().map(|c| (c.id, c.into())).collect();

        MapQueryEngine { country_map, tree }
    }

    #[inline]
    fn proximity_query(&self, centre_id: i16, radius: f64) -> Result<Vec<ProximityMatch>> {
        let centre = self
            .country_map
            .get(&centre_id)
            .context("unknown country")?
            .cartesian;

        let matches = if radius > 1.3 {
            self.country_map
                .values()
                .flat_map(|c| {
                    let dist = (c.cartesian - centre).gc_dist();
                    if dist < radius {
                        Some(ProximityMatch { id: c.id, dist })
                    } else {
                        None
                    }
                })
                .collect()
        } else {
            let eucl_radius = 2.0 * (radius / 2.0).sin();
            self.tree.proximity_search(centre, eucl_radius)
        };

        Ok(matches)
    }

    #[inline]
    fn route_query(&self, start: i16, end: i16, elasticity: f64) -> Result<Vec<RouteStep>> {
        let start_country = self.country_map.get(&start).context("unknown country")?;
        let end_country = self.country_map.get(&end).context("unknown country")?;

        let mut route = Route {
            start_id: start,
            end_id: end,
            start_coords: start_country.cartesian,
            end_coords: end_country.cartesian,

            next: None,
        };

        let mut visited = HashSet::with_capacity(8);
        visited.insert(start);
        let mut current = &mut route;

        loop {
            while let Some((id, coords)) = self.tree.relax(
                (current.start_id, current.start_coords),
                (current.end_id, current.end_coords),
                elasticity,
            ) {
                if visited.contains(&id) {
                    break;
                }

                visited.insert(id);

                let next = current.next.take();
                current.next = Some(Box::new(Route {
                    start_id: id,
                    end_id: current.end_id,
                    start_coords: coords,
                    end_coords: current.end_coords,

                    next,
                }));

                current.end_id = id;
                current.end_coords = coords;
            }

            if let Some(next) = &mut current.next {
                current = next;
            } else {
                break;
            }
        }

        Ok(route.into())
    }
}

#[napi(js_name = "MapQueryEngine")]
pub struct JsMapQueryEngine {
    inner: Arc<MapQueryEngine>,
}

#[napi]
impl JsMapQueryEngine {
    #[napi(factory)]
    pub fn with_countries(countries: Vec<Country>) -> JsMapQueryEngine {
        JsMapQueryEngine {
            inner: Arc::new(MapQueryEngine::new(countries)),
        }
    }

    #[napi]
    pub async fn proximity_query(
        &self,
        centre_id: i16,
        radius: f64,
    ) -> Result<Vec<ProximityMatch>> {
        let inner_ref = self.inner.clone();
        tokio::task::spawn_blocking(move || inner_ref.proximity_query(centre_id, radius))
            .await
            .context("proximity query task failed")?
    }

    #[napi]
    pub async fn route_query(
        &self,
        start_id: i16,
        end_id: i16,
        elasticity: f64,
    ) -> Result<Vec<RouteStep>> {
        let inner_ref = self.inner.clone();
        tokio::task::spawn_blocking(move || inner_ref.route_query(start_id, end_id, elasticity))
            .await
            .context("route query task failed")?
    }
}
