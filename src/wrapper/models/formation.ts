import * as t from "io-ts";

import { UserData } from "./user";

export const FormationData = t.type({
    coleader: t.string,
    id: t.string,
    leader: t.string,
    locked: t.boolean,
    members: t.array(UserData),
    name: t.string,
    tag: t.string,
});

export type FormationData = t.TypeOf<typeof FormationData>;
