import * as t from "io-ts";

import { Statistics, Timers, Team } from "./common";

export const PersonalStats = t.type({
    units: t.type({
        jeepsKilled: t.number,
        tanksKilled: t.number,
        choppersKilled: t.number,
        planesKilled: t.number,
        stealthBombersKilled: t.number,
        navalKilled: t.number,
    }),
    facilities: t.type({
        spend: t.number,
        destroyed: t.number,
    }),
    wins: t.type({
        axis: t.number,
        allies: t.number,
    }),
    losses: t.number,
    assaults: t.type({
        attacks: t.number,
        defends: t.number,
        damageDealt: t.number,
        lossesSustained: t.number,
    }),
    travels: t.number,
    capturingHours: t.number,
});

export const Skills = t.type({
    income: t.number,
    operations: t.number,
    ranking: t.number,
    queue: t.number,
    travelTime: t.number,
    footAttack: t.number,
    landAttack: t.number,
    airAttack: t.number,
    navalAttack: t.number,
    footDefence: t.number,
    landDefence: t.number,
    airDefence: t.number,
    navalDefence: t.number,
});

export type Skills = t.TypeOf<typeof Skills>;

export const ReimbursementInfo = t.type({
    amount: t.number,
    type: t.string,
    time: t.union([t.number, t.literal(false)]),
    id: t.string,
});

export type ReimbursementInfo = t.TypeOf<typeof ReimbursementInfo>;

export const Reimbursement = t.type({
    amount: t.number,
    isLocked: t.boolean,
    fullInformation: t.array(ReimbursementInfo),
});

export const PrivateUserData = t.type({
    statistics: Statistics,
    personalStats: PersonalStats,
    funds: t.number,
    income: t.number,
    points: t.number,
    timers: Timers,
    skills: Skills,
    unlockedUnits: t.array(t.unknown),
    country: t.string,
    discordID: t.string,
    formation: t.string,
    reimbursement: Reimbursement,
});

export type PrivateUserData = t.TypeOf<typeof PrivateUserData>;

export const UserData = t.type({
    id: t.string,
    name: t.string,
    team: Team,
    joined: t.number,
    rank: t.number,
    rating: t.number,
    lastAction: t.number,
    motto: t.string,
    formation: t.union([t.string, t.undefined]),
});

export type UserData = t.TypeOf<typeof UserData>;
