import * as t from "io-ts";
import type { Either } from "fp-ts/lib/Either.js";
import type { Team as TeamType } from "../../service/util/constants.js";

const _Team = t.union([
    t.literal("Allies"),
    t.literal("Axis"),
    t.literal("None"),
    t.literal("Auto"),
]);

export const Team = new t.Type<TeamType, string, unknown>(
    "Team",
    (u): u is TeamType => _Team.is(u),
    (u, c) => _Team.validate(u, c) as Either<t.Errors, TeamType>,
    _Team.encode
);

export const FEErrorResponse = t.type({
    reason: t.string,
    error: t.literal(true),
    data: t.type({
        code: t.number,
    }),
});

export type FEErrorResponse = t.TypeOf<typeof FEErrorResponse>;

export const feResponse = <C extends t.Mixed>(codec: C) =>
    t.union([
        FEErrorResponse,
        t.type({
            error: t.literal(false),
            reason: t.literal(false),
            data: codec,
        }),
    ]);

export interface ErrorResponse {
    reason: string;
    error: true;
    data: {
        code: number;
    };
}

export const Statistics = t.type({
    strength: t.union([t.string, t.number]),
    intelligence: t.union([t.string, t.number]),
    leadership: t.union([t.string, t.number]),
    communication: t.union([t.string, t.number]),
});

export const Timers = t.type({
    statistics: t.number,
    operations: t.number,
    politics: t.number,
    war: t.number,
    reimbursement: t.number,
});
