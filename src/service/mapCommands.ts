import { MessageEmbed } from "discord.js";

import {
    TotalsQueryRow,
    IncomeQuery,
} from "../repository/LandAndFacilitiesRepository";
import { RegionQueryRow } from "../repository/UnitChangeRepository";

import { getIcon, teamFromControl, convertAxisControl } from "./util/team";
import { Color, FacilityIncome } from "./util/constants";

export function buildTotals(
    totals: TotalsQueryRow,
    title: string,
    desc: string
): MessageEmbed {
    const alliesIncome = formatMoney(
        totals.total_allies_rigs * FacilityIncome.RIG +
            totals.total_allies_facs * FacilityIncome.FACTORY +
            totals.total_allies_mines * FacilityIncome.MINE
    );

    const axisIncome = formatMoney(
        totals.total_axis_rigs * FacilityIncome.RIG +
            totals.total_axis_facs * FacilityIncome.FACTORY +
            totals.total_axis_mines * FacilityIncome.MINE
    );

    return new MessageEmbed()
        .setTitle(title)
        .setDescription(desc)
        .addField(
            "Capped/Uncapped",
            `${totals.allies_capped}/${totals.allies_uncapped} vs. ${totals.axis_capped}/${totals.axis_uncapped}`,
            true
        )
        .addField(
            "Units",
            `${totals.total_allies} vs. ${totals.total_axis}`,
            true
        )
        .addField(
            "Factories",
            `${totals.total_allies_facs} vs. ${totals.total_axis_facs}`,
            true
        )
        .addField(
            "Oil rigs",
            `${totals.total_allies_rigs} vs. ${totals.total_axis_rigs}`,
            true
        )
        .addField(
            "Mines",
            `${totals.total_allies_mines} vs. ${totals.total_axis_mines}`,
            true
        )
        .addField("Income", `${alliesIncome} vs. ${axisIncome}`, true)
        .setColor(Color.BLUE);
}

export function buildIncome(
    results: IncomeQuery,
    title: string,
    type: string,
    incomePer: number
): MessageEmbed {
    return new MessageEmbed()
        .setTitle(title)
        .setDescription(
            `${type} income generating countries (displaying >1% of team total)`
        )
        .addField(
            "Totals",
            `${results.allies_total} (${formatMoney(
                results.allies_total * incomePer
            )}) vs. ${results.axis_total} (${formatMoney(
                results.axis_total * incomePer
            )})`
        )
        .addField(
            "Allies",
            results.allies
                .filter(({ num }) => num > results.allies_total * 0.01)
                .map(
                    ({ num, name }) =>
                        `${getIcon(1)} ${name} — ${num} (${formatMoney(
                            num * incomePer
                        )})`
                )
                .join("\n") || "\u200B",
            true
        )
        .addField(
            "Axis",
            results.axis
                .filter(({ num }) => num > results.axis_total * 0.01)
                .map(
                    ({ num, name }) =>
                        `${getIcon(2)} ${name} — ${num} (${formatMoney(
                            num * incomePer
                        )})`
                )
                .join("\n") || "\u200B",
            true
        )
        .setColor(Color.BLUE);
}

export function formatMoney(amount: number): string {
    if (amount < 1_000_000_000) {
        return "$" + Math.round(amount / 100_000) / 10 + "M";
    } else {
        return "$" + Math.round(amount / 100_000_000) / 10 + "B";
    }
}

export function buildRegionUnitList(units: RegionQueryRow[]): string {
    return units
        .map(
            (row) =>
                `${getIcon(teamFromControl(row.control))} ${
                    row.name
                } (${convertAxisControl(
                    row.control,
                    teamFromControl(row.control)
                )}%) — ${row.allies} vs. ${row.axis}`
        )
        .join("\n");
}
