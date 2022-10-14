export enum Icon {
    ALLIES = "🟢",
    AXIS = "🔴",
    NEUTRAL = "⚪",
}

export enum Team {
    ALLIES = "Allies",
    AXIS = "Axis",
    NONE = "None",
    AUTO = "Auto",
}

export enum Color {
    RED = "DarkRed",
    GREEN = "DarkGreen",
    BLUE = "DarkBlue",
    NUKE = "Orange",
    YELLOW = "Yellow",
    BRIGHT_RED = "Red",
}

export enum FacilityIncome {
    FACTORY = 1_500_000,
    MINE = 500_000,
    RIG = 100_000_000,
}

export enum ButtonColor {
    ENABLED = "Primary",
    DISABLED = "Secondary",
}
export const rankMap = new Map<number, string>([
    [1, "Pvt."],
    [2, "Cpl."],
    [3, "Sgt."],
    [4, "Lt."],
    [5, "Cap."],
    [6, "Maj."],
    [7, "Ltc."],
    [8, "Col."],
    [9, "Brg."],
    [10, "Mg."],
    [11, "Ltg."],
    [12, "Gen."],
    [13, "Mar."],
    [14, "Gov."],
    [15, "Amb."],
    [16, "Sen."],
    [17, "V.P."],
    [18, "Pres."],
]);
