import { Color, Icon } from "./constants";

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

export function getColor(team: number) {
    if (team === 1) {
        return Color.GREEN;
    } else if (team === 2) {
        return Color.RED;
    } else {
        return Color.BLUE;
    }
}
