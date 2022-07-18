import * as t from "io-ts";

export const AllUnitsData = t.type({
    cost: t.number,
    id: t.string,
    isUnlockableUnit: t.boolean,
    name: t.string,
    team: t.number,
    type: t.string,
});

export type AllUnitsData = t.TypeOf<typeof AllUnitsData>;
