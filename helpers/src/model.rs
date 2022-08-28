use napi_derive::napi;

#[derive(Debug, Clone)]
#[napi(object)]
pub struct Country {
    pub coordinates: SphereCoordinates,
    pub id: i16,
}

#[derive(Debug, Clone, Copy)]
pub enum Axis {
    X,
    Y,
    Z,
}

#[derive(Debug, Clone, Copy)]
pub struct CartesianCoordinates([f64; 3]);

#[derive(Debug, Clone, Copy)]
#[napi(object)]
pub struct SphereCoordinates {
    pub latitude: f64,
    pub longitude: f64,
}

impl CartesianCoordinates {
    #[inline]
    pub fn get_axis(&self, axis: Axis) -> f64 {
        match axis {
            Axis::X => self.0[0],
            Axis::Y => self.0[1],
            Axis::Z => self.0[2],
        }
    }
}

impl std::convert::From<SphereCoordinates> for CartesianCoordinates {
    fn from(c: SphereCoordinates) -> Self {
        let phi = c.longitude.to_radians();
        let theta = std::f64::consts::FRAC_PI_2 - c.latitude.to_radians();
        Self([
            phi.cos() * theta.sin(),
            phi.sin() * theta.sin(),
            theta.cos(),
        ])
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Vec3([f64; 3]);

impl Vec3 {
    #[inline]
    pub fn norm_squared(&self) -> f64 {
        self.0[0].powi(2) + self.0[1].powi(2) + self.0[2].powi(2)
    }

    #[inline]
    pub fn norm(&self) -> f64 {
        self.norm_squared().sqrt()
    }

    #[inline]
    pub fn dot(&self, other: &Self) -> f64 {
        self.0[0] * other.0[0] + self.0[1] * other.0[1] + self.0[2] * other.0[2]
    }

    #[inline]
    pub fn gc_dist(&self) -> f64 {
        2.0 * (self.norm() / 2.0).asin()
    }
}

impl std::ops::Sub<CartesianCoordinates> for CartesianCoordinates {
    type Output = Vec3;

    fn sub(self, rhs: CartesianCoordinates) -> Self::Output {
        Vec3([
            self.0[0] - rhs.0[0],
            self.0[1] - rhs.0[1],
            self.0[2] - rhs.0[2],
        ])
    }
}

pub struct ProjectedCountry {
    pub id: i16,
    pub coords: CartesianCoordinates,
}

impl ProjectedCountry {
    pub fn from_country(country: Country) -> Self {
        ProjectedCountry {
            id: country.id,
            coords: country.coordinates.into(),
        }
    }
}

pub fn mean(axis: Axis, countries: &[ProjectedCountry]) -> f64 {
    let sum: f64 = countries.iter().map(|c| c.coords.get_axis(axis)).sum();

    sum / countries.len() as f64
}

pub fn variance(axis: Axis, countries: &[ProjectedCountry]) -> f64 {
    let mean = mean(axis, countries);

    let sum: f64 = countries
        .iter()
        .map(|c| (c.coords.get_axis(axis) - mean).powi(2))
        .sum();

    sum / countries.len() as f64
}

pub fn pick_axis(countries: &[ProjectedCountry]) -> Axis {
    let x_var = variance(Axis::X, countries);
    let y_var = variance(Axis::Y, countries);
    let z_var = variance(Axis::Z, countries);

    if x_var > z_var && x_var > y_var {
        Axis::X
    } else if y_var > z_var {
        Axis::Y
    } else {
        Axis::Z
    }
}
