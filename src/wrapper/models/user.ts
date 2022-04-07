import { Statistics, Timers } from "./common";

export interface UserData {
    id: number;
    name: string;
    team: "Allies" | "Axis" | "None" | "Auto";
    joined: number;
    rank: number;
    rating: number;
    lastAction: number;
    motto: string;
    statistics: Statistics;
    personalStats: PersonalStats;
    funds: number;
    income: number;
    points: number;
    timers: Timers;
    skills: Skills;
    unlockedUnits: [];
    country: number;
    discordID: number;
    formation: number;
    reimbursement: Reimbursement;
}

export interface PersonalStats {
    units: {
        jeepsKilled: number;
        tanksKilled: number;
        choppersKilled: number;
        planesKilled: number;
        stealthBombersKilled: number;
        navalKilled: number;
    };
    facilities: {
        spend: number;
        destroyed: number;
    };
    wins: {
        axis: number;
        allies: number;
    };
    losses: number;
    assaults: {
        attacks: number;
        defends: number;
        damageDealt: number;
        lossesSustained: number;
    };
    travels: number;
    capturingHours: number;
}

export interface Skills {
    income: number;
    operations: number;
    ranking: number;
    queue: number;
    travelTime: number;
    footAttack: number;
    landAttack: number;
    airAttack: number;
    navalAttack: number;
    footDefence: number;
    landDefence: number;
    airDefence: number;
    navalDefence: number;
}

export interface Reimbursement {
    amount: number;
    isLocked: boolean;
    fullInformation: [
        {
            amount: number;
            type: string;
            time: boolean;
            id: number;
        }
    ];
}
