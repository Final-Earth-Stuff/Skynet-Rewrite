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
