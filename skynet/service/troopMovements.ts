import { UnitChange } from "../entity/UnitChange.js";
import { CountryData } from "../wrapper/models/country.js";
import { Client, EmbedBuilder, ChannelType } from "discord.js";
import { AppDataSource } from "../index.js";
import { Guild } from "../entity/Guild.js";
import { getIcon, convertAxisControl } from "./util/team.js";
import { Color } from "./util/constants.js";
import { getDistance } from "../map/util.js";
import { isSome } from "../util/guard.js";
import { unwrap } from "../util/assert.js";

type Units = Omit<UnitChange, "id">;

export function changedUnitsFromWorld(
    world: CountryData[],
    prevUnits: UnitChange[]
) {
    const prevMap = new Map(
        prevUnits.map((country) => [country.country.toString(), country])
    );

    const newCountries = world
        .filter(({ id }) => !prevMap.has(id))
        .map((country) => ({
            country: parseInt(country.id),
            axis: country.units.axis,
            allies: country.units.allies,
            delta_axis: 0,
            delta_allies: 0,
        }));

    const changes = world
        .map((country) => {
            const prev = prevMap.get(country.id);
            if (prev && !compareUnits(country, prev)) {
                return buildUnitChange(country, prev);
            }
        })
        .filter(isSome);

    const alliesMap = changes.reduce(
        (m, c) =>
            m.set(c.delta_allies, (m.get(c.delta_allies) ?? []).concat([c])),
        new Map<number, Units[]>()
    );
    const axisMap = changes.reduce(
        (m, c) => m.set(c.delta_axis, (m.get(c.delta_axis) ?? []).concat([c])),
        new Map<number, Units[]>()
    );

    changes.forEach((change) => {
        if (
            change.delta_allies > 0 &&
            alliesMap.get(change.delta_allies)?.length === 1
        ) {
            const opposite = alliesMap.get(-change.delta_allies);
            if (opposite && opposite.length === 1) {
                change.previous_country_allies = opposite[0].country;
                // remove opposite event so it doesn't get displayed
                alliesMap.delete(-change.delta_allies);
            }
        }

        if (
            change.delta_axis > 0 &&
            axisMap.get(change.delta_axis)?.length === 1
        ) {
            const opposite = axisMap.get(-change.delta_axis);
            if (opposite && opposite.length === 1) {
                change.previous_country_axis = opposite[0].country;
                // remove opposite event so it doesn't get displayed
                axisMap.delete(-change.delta_axis);
            }
        }
    });

    // eliminate duplicates
    const validDeltas = new Set(
        [...alliesMap.values()]
            .flat()
            .concat([...axisMap.values()].flat())
            .filter(
                ({ delta_allies, delta_axis }) =>
                    // remove events that are the origin of a movement
                    !(
                        (delta_allies === 0 || !alliesMap.has(delta_allies)) &&
                        (delta_axis === 0 || !axisMap.has(delta_axis))
                    )
            )
    );

    return {
        notifications: [...validDeltas],
        changes: [...changes, ...newCountries],
    };
}

export async function prepareAndSendMessage(
    client: Client,
    changedUnits: Units[],
    world: CountryData[]
) {
    const countryInfo = new Map(
        world.map((country) => [parseInt(country.id), country])
    );

    const embeds = changedUnits
        .filter((u) => u.delta_allies || u.delta_axis)
        .map((u) => buildEmbed(u, countryInfo));

    const guildRepository = AppDataSource.getRepository(Guild);
    const guilds = await guildRepository.find();
    await Promise.all(
        guilds.map(async (guild) => {
            if (guild.troop_movement_channel) {
                const channel = client.channels.cache.get(
                    guild.troop_movement_channel
                );
                if (!channel || channel.type !== ChannelType.GuildText) return;

                const copy = [...embeds];
                while (copy.length) {
                    const embeds = copy.splice(0, 10);
                    await channel.send({ embeds }).catch(() => {
                        /* do nothing */
                    });
                }
            }
        })
    );
}

function buildEmbed(unit: Units, countryInfo: Map<number, CountryData>) {
    const country = unwrap(countryInfo.get(unit.country));
    const icon = getIcon(country.controlTeam);
    const control = convertAxisControl(country.control, country.controlTeam);

    return new EmbedBuilder()
        .setTitle(`${icon} ${country.name} (${control}%) [${country.region}]`)
        .setDescription(getEmbedDesc(unit, countryInfo))
        .addFields(
            {
                name: "Allied Forces",
                value: `${unit.allies} (${unit.delta_allies})`,
                inline: true,
            },
            {
                name: "Axis Forces",
                value: `${unit.axis} (${unit.delta_axis})`,
                inline: true,
            }
        )
        .setColor(colorForEvent(unit));
}

function getEmbedDesc(unit: Units, countryInfo: Map<number, CountryData>) {
    if (!unit.previous_country_axis && !unit.previous_country_allies) {
        return "Change in unit count detected:";
    }

    const desc = [];
    if (unit.previous_country_allies) {
        const prevAllies = unwrap(
            countryInfo.get(unit.previous_country_allies)
        );
        const prevIcon = getIcon(prevAllies.controlTeam);
        const prevControl = convertAxisControl(
            prevAllies.control,
            prevAllies.controlTeam
        );
        const time = buildTravelStr(unit.country, unit.previous_country_allies);

        desc.push(
            `Allied units have arrived from ${prevIcon} ${prevAllies.name} (${prevControl}%) (${time}mins):`
        );
    }
    if (unit.previous_country_axis) {
        const prevAxis = unwrap(countryInfo.get(unit.previous_country_axis));
        const prevIcon = getIcon(prevAxis.controlTeam);
        const prevControl = convertAxisControl(
            prevAxis.control,
            prevAxis.controlTeam
        );
        const time = buildTravelStr(unit.country, unit.previous_country_axis);

        desc.push(
            `Axis units have arrived from ${prevIcon} ${prevAxis.name} (${prevControl}%) (${time}mins):`
        );
    }

    return desc.join("\n");
}

function colorForEvent(change: Units): Color {
    if (change.delta_allies && !change.delta_axis) {
        return Color.GREEN;
    }
    if (!change.delta_allies && change.delta_axis) {
        return Color.RED;
    }
    return Color.BLUE;
}

function buildTravelStr(origin: number, destination: number) {
    const maxTravelTime = getDistance(origin, destination, 0);
    const minTravelTime = getDistance(origin, destination, 25);
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
        delta_axis: country.units.axis - prev.axis,
        delta_allies: country.units.allies - prev.allies,
    };
}
