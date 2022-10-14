import * as t from "io-ts";

export const UnitsData = t.type({
    busy: t.number,
    id: t.string,
    quantity: t.number,
});

export type UnitsData = t.TypeOf<typeof UnitsData>;
