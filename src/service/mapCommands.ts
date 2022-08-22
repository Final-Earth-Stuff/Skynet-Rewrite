import { EmbedBuilder } from "discord.js";

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
): EmbedBuilder {
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

    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .addFields(
            {
                name: "Capped/Uncapped",
                value: `${totals.allies_capped}/${totals.allies_uncapped} vs. ${totals.axis_capped}/${totals.axis_uncapped}`,
                inline: true,
            },
            {
                name: "Units",
                value: `${totals.total_allies} vs. ${totals.total_axis}`,
                inline: true,
            },
            {
                name: "Factories",
                value: `${totals.total_allies_facs} vs. ${totals.total_axis_facs}`,
                inline: true,
            },
            {
                name: "Oil rigs",
                value: `${totals.total_allies_rigs} vs. ${totals.total_axis_rigs}`,
                inline: true,
            },
            {
                name: "Mines",
                value: `${totals.total_allies_mines} vs. ${totals.total_axis_mines}`,
                inline: true,
            },
            {
                name: "Income",
                value: `${alliesIncome} vs. ${axisIncome}`,
                inline: true,
            }
        )
        .setColor(Color.BLUE);
}

export function buildIncome(
    results: IncomeQuery,
    title: string,
    type: string,
    incomePer: number
): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(
            `${type} income generating countries (displaying >1% of team total)`
        )
        .addFields(
            {
                name: "Totals",
                value: `${results.allies_total} (${formatMoney(
                    results.allies_total * incomePer
                )}) vs. ${results.axis_total} (${formatMoney(
                    results.axis_total * incomePer
                )})`,
            },
            {
                name: "Allies",
                value:
                    results.allies
                        .filter(({ num }) => num > results.allies_total * 0.01)
                        .map(
                            ({ num, name }) =>
                                `${getIcon(1)} ${name} — ${num} (${formatMoney(
                                    num * incomePer
                                )})`
                        )
                        .join("\n") || "\u200B",
                inline: true,
            },
            {
                name: "Axis",
                value:
                    results.axis
                        .filter(({ num }) => num > results.axis_total * 0.01)
                        .map(
                            ({ num, name }) =>
                                `${getIcon(2)} ${name} — ${num} (${formatMoney(
                                    num * incomePer
                                )})`
                        )
                        .join("\n") || "\u200B",
                inline: true,
            }
        )
        .setColor(Color.BLUE);
}

export function formatMoney(amount: number): string {
    if (amount < 1_000_000_000) {
        return `$${Math.round(amount / 100_000) / 10}M`;
    } else {
        return `$${Math.round(amount / 100_000_000) / 10}B`;
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
