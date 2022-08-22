import { CountryData } from "src/wrapper/models/country";
import { Icon } from "./constants";

export function getIcon(team: number) {
    if (team === 1) {
        return Icon.ALLIES;
    } else if (team === 2) {
        return Icon.AXIS;
    } else {
        return Icon.NEUTRAL;
    }
}

export function convertAxisControl(control: number, team: number) {
    if (team === 2) {
        return 100 - control;
    }
    return control;
}

export function teamFromControl(control: number): number {
    if (control < 50) {
        return 2;
    } else if (control > 50) {
        return 1;
    } else {
        return 0;
    }
}

export function isRoundOver(world: CountryData[]): boolean {
    const axisSpanws = world.filter(c => c.isActiveSpawn && c.isSpawn && c.initialControl === 0)
    const alliesSpanws = world.filter(c => c.isActiveSpawn && c.isSpawn && c.initialControl === 100)
    return alliesSpanws.length === 0 || axisSpanws.length === 0;
}
