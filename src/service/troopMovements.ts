import { UnitChange } from "../entity/UnitChange";
import { CountryData } from "../wrapper/models/country";
import { Client, TextChannel, MessageEmbed } from "discord.js";
import { AppDataSource } from "..";
import { Guild } from "../entity/Guild";
import { getIcon, convertAxisControl, getColor } from "./util/team";
import { Color } from "./util/constants";
import { getDistance } from "../map/util";

type Units = Omit<UnitChange, "id">;

export function changedUnitsFromWorld(
    world: CountryData[],
    prevUnits: UnitChange[]
): Units[] {
    return world
        .map((country) => {
            const prev = prevUnits.find(
                (units) => parseInt(country.id) === units.country
            );
            if (prev && !compareUnits(country, prev)) {
                return buildUnitChange(country, prev);
            }
            return;
        })
        .filter((a) => a) as Units[];
}

export function detectOrigin(changedWorld: Units[]): Units[] {
    const allies: Map<number, Units[]> = new Map();
    const axis: Map<number, Units[]> = new Map();

    changedWorld.map((c1) => {
        if (c1.delta_allies !== 0) {
            const delta = Math.abs(c1.delta_allies);
            if (allies.has(delta)) {
                allies.get(delta)?.push(c1);
            } else {
                allies.set(delta, [c1]);
            }
        }

        if (c1.delta_axis !== 0) {
            const delta = Math.abs(c1.delta_axis);
            if (axis.has(delta)) {
                axis.get(delta)?.push(c1);
            } else {
                axis.set(delta, [c1]);
            }
        }
    });

    return buildAlliesChanges(allies).concat(buildAxisChanges(axis));
}

export async function prepareAndSendMessage(
    client: Client,
    changedUnits: Units[],
    world: CountryData[]
) {
    const countryInfo: Map<number, CountryData> = new Map();
    world.map((country) => {
        countryInfo.set(parseInt(country.id), country);
    });

    const guildRepository = AppDataSource.getRepository(Guild);
    const guilds = await guildRepository.find();
    guilds.forEach((guild) => {
        if (guild.troop_movement_channel) {
            const channel: TextChannel = client.channels.cache.get(
                guild.troop_movement_channel
            ) as TextChannel;

            changedUnits.forEach(async (unit) => {
                sendTMMessage(unit, channel, countryInfo);
            });
        }
    });
}

function sendTMMessage(
    unit: Units,
    channel: TextChannel,
    countryInfo: Map<number, CountryData>
) {
    const country = countryInfo.get(unit.country);
    const icon = getIcon(country?.controlTeam ?? 0);
    const control = getControl(country);
    const team = unit.delta_allies !== 0 ? 1 : 2;

    const embed = new MessageEmbed()
        .setTitle(`${icon} ${country?.name} (${control}%) [${country?.region}]`)
        .setDescription(
            unit.previous_country
                ? getEmbedDesc(unit, countryInfo)
                : `Change in unit count detected:`
        )
        .addField(
            "Allied Forces",
            `${unit.allies} (${unit.delta_allies})`,
            true
        )
        .addField("Axis Forces", `${unit.axis} (${unit.delta_axis})`, true)
        .setColor(unit.previous_country ? getColor(team) : Color.BLUE);
    channel?.send({ embeds: [embed] });
}

function getEmbedDesc(unit: Units, countryInfo: Map<number, CountryData>) {
    const prevCountry = countryInfo.get(unit.previous_country ?? 0);
    const prevIcon = getIcon(prevCountry?.controlTeam ?? 0);
    const teamName = unit.delta_allies !== 0 ? "Allied" : "Axis";
    const control = getControl(prevCountry);
    const time = buildTravelStr(unit);

    return `${teamName} units have arrived from ${prevIcon} ${prevCountry?.name} (${control}%) (${time}mins)`;
}

function getControl(country: CountryData | undefined) {
    return convertAxisControl(country?.control ?? 0, country?.controlTeam ?? 0);
}

function buildTravelStr(unit: Units) {
    const maxTravelTime = getDistance(
        unit.country,
        unit.previous_country ?? 0,
        0
    );
    const minTravelTime = getDistance(
        unit.country,
        unit.previous_country ?? 0,
        25
    );
    return `${minTravelTime}-${maxTravelTime}`;
}
function compareUnits(u1: CountryData, u2: UnitChange): boolean {
    return u1.units.axis === u2.axis && u1.units.allies === u2.allies;
}

function buildUnitChange(country: CountryData, prev: UnitChange): Units {
    return {
        country: parseInt(country.id),
        axis: country.units.axis,
        allies: country.units.allies,
        delta_axis: country.units.axis - (prev?.axis ?? 0),
        delta_allies: country.units.allies - (prev?.allies ?? 0),
        timestamp: new Date(),
    };
}

function buildAlliesChanges(allies: Map<number, Units[]>) {
    let arr: Units[] = [];

    allies.forEach(function (value) {
        if (value.length === 2) {
            if (value[0].delta_allies > 0 && value[1].delta_allies < 0) {
                value[0].previous_country = value[1].country;
                arr.push(value[0]);
            } else if (value[0].delta_allies < 0 && value[1].delta_allies > 0) {
                value[1].previous_country = value[0].country;
                arr.push(value[1]);
            }
        } else {
            arr = arr.concat(value);
        }
    });
    return arr;
}

function buildAxisChanges(axis: Map<number, Units[]>) {
    let arr: Units[] = [];

    axis.forEach(function (value) {
        if (value.length === 2) {
            if (value[0].delta_axis > 0 && value[1].delta_axis < 0) {
                value[0].previous_country = value[1].country;
                arr.push(value[0]);
            } else if (value[0].delta_axis < 0 && value[1].delta_axis > 0) {
                value[1].previous_country = value[0].country;
                arr.push(value[1]);
            }
        } else {
            arr = arr.concat(value);
        }
    });
    return arr;
}
