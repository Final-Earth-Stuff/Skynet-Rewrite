import { Country } from "./";
import {
    Coordinates,
    projectToUnitSphere,
    gcToEuclidean,
    euclideanMetric,
    euclideanToGc,
} from "./geometry";

export interface TreeNode {
    id: number;
    coordinates: Coordinates;
    axis: keyof Coordinates;

    leftChild?: TreeNode;
    rightChild?: TreeNode;
}

let tree: TreeNode | undefined = undefined;

const AXES = ["x", "y", "z"] as const;

function buildRecursive(
    values: { c: Coordinates; id: number }[],
    depth: number
): TreeNode {
    const axis = AXES[depth % 3];

    const sorted = values.sort(({ c: c1 }, { c: c2 }) => c1[axis] - c2[axis]);
    const mid = Math.floor(sorted.length / 2);

    const left = sorted.slice(0, mid);
    const right = sorted.slice(mid + 1);
    const midElm = sorted[mid];

    return {
        id: midElm.id,
        coordinates: midElm.c,
        axis,

        leftChild:
            left.length > 0 ? buildRecursive(left, depth + 1) : undefined,
        rightChild:
            right.length > 0 ? buildRecursive(right, depth + 1) : undefined,
    };
}

export const buildTree = (countries: Country[]) => {
    const values = [...countries.values()].map(({ id, coordinates: c }) => ({
        id,
        c: projectToUnitSphere(c),
    }));

    tree = buildRecursive(values, 0);
    return tree;
};

interface RangeMatch {
    id: number;
    distKm: number;
}

export async function findInRange(
    center: Country,
    node: TreeNode,
    rangeKm: number
): Promise<RangeMatch[]> {
    const range = gcToEuclidean(rangeKm);

    return findInRangeRecursive(
        node,
        projectToUnitSphere(center.coordinates),
        range
    );
}

function findInRangeRecursive(
    node: TreeNode,
    center: Coordinates,
    range: number
): RangeMatch[] {
    const result = new Array<RangeMatch>();

    const euclDist = euclideanMetric(center, node.coordinates);
    if (euclDist < range) {
        result.push({
            id: node.id,
            distKm: euclideanToGc(euclDist),
        });
    }

    const split = node.coordinates[node.axis];
    const projection = center[node.axis];
    if (node.leftChild && projection - split < range) {
        result.push(...findInRangeRecursive(node.leftChild, center, range));
    }
    if (node.rightChild && split - projection < range) {
        result.push(...findInRangeRecursive(node.rightChild, center, range));
    }

    return result;
}
