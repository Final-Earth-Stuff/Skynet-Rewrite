import { CountryData } from "../wrapper/models/country.js";
import { LandAndFacilities } from "../entity/LandAndFacilities.js";
import { Client, EmbedBuilder, ChannelType } from "discord.js";
import { AppDataSource } from "../index.js";
import { Guild } from "../entity/Guild.js";
import { getIcon, convertAxisControl } from "./util/team.js";
import { Color } from "./util/constants.js";
import { unwrap } from "../util/assert.js";
import { isSome } from "../util/guard.js";

type Laf = Omit<LandAndFacilities, "id">;

export function convertWorld(world: CountryData[]) {
    return world.map((country) => {
        return {
            country: parseInt(country.id),
            land: country.land,
            rigs: country.facilities.rigs,
            facs: country.facilities.factories,
            mines: country.facilities.mines,
            ads: country.facilities.airDefences,
            gds: country.facilities.groundDefences,
            is_active_spawn: country.isActiveSpawn,
            control: country.control,
            timestamp: new Date(),
        };
    });
}

export function compareCountry(c1: Laf, c2: LandAndFacilities) {
    return (
        c1.country === c2.country &&
        c1.land === c2.land &&
        c1.rigs === c2.rigs &&
        c1.facs === c2.facs &&
        c1.mines === c2.mines &&
        c1.ads === c2.ads &&
        c1.gds === c2.gds &&
        c1.is_active_spawn === c2.is_active_spawn &&
        c1.control === c2.control
    );
}

export async function logChangesToChannel(
    client: Client,
    changedLand: Laf[],
    prevLand: LandAndFacilities[],
    world: CountryData[]
) {
    const countryInfo = new Map(
        world.map((country) => [parseInt(country.id), country])
    );

    const curr = changedLand.filter(
        (item1) => !prevLand.some((item2) => compareFacilities(item1, item2))
    );

    const prevMap = new Map(prevLand.map((c) => [c.country, c]));
    const embeds = curr
        .map((land) => {
            const prev = prevMap.get(land.country);
            if (prev) {
                return buildEmbed(land, prev, countryInfo);
            }
        })
        .filter(isSome);

    const guildRepository = AppDataSource.getRepository(Guild);
    const guilds = await guildRepository.find();
    await Promise.all(
        guilds.map(async (guild) => {
            if (guild.land_facility_channel) {
                const channel = client.channels.cache.get(
                    guild.land_facility_channel
                );
                if (!channel || channel.type !== ChannelType.GuildText) return;

                const copy = [...embeds];
                while (copy.length) {
                    const embeds = copy.splice(0, 10);
                    await channel.send({ embeds });
                }
            }
        })
    );
}

function buildEmbed(
    laf: Laf,
    prev: LandAndFacilities,
    countryInfo: Map<number, CountryData>
) {
    const country = unwrap(countryInfo.get(laf.country));
    const icon = getIcon(country.controlTeam);
    const control = convertAxisControl(country.control, country.controlTeam);

    const embed = new EmbedBuilder()
        .addFields(
            {
                name: "Ground Defenses",
                value: `${laf.gds} (${laf.gds - prev.gds})`,
                inline: true,
            },
            {
                name: "Air Defenses",
                value: `${laf.ads} (${laf.ads - prev.ads})`,
                inline: true,
            },
            {
                name: "Factories",
                value: `${laf.facs} (${laf.facs - prev.facs})`,
                inline: true,
            },
            {
                name: "Mines",
                value: `${laf.mines} (${laf.mines - prev.mines})`,
                inline: true,
            },
            {
                name: "Oil Rigs",
                value: `${laf.rigs} (${laf.rigs - prev.rigs})`,
                inline: true,
            }
        )
        .setColor(colorForEvent(laf, prev));

    if (isNuclearStrike(laf, prev)) {
        embed
            .setTitle(`Nuclear strike detected in ${country.name}!`)
            .setDescription(`The following was lost in the strike:`)
            .addFields({
                name: "Land",
                value: `${laf.land} (${laf.land - prev.land})`,
                inline: true,
            });
    } else {
        embed
            .setTitle(
                `${icon} ${country.name} (${control}%) [${country.region}]`
            )
            .setDescription(`Change in facility count detected:`)
            .addFields({
                name: "\u200B",
                value: "\u200B",
                inline: true,
            });
    }
    return embed;
}

function colorForEvent(laf: Laf, prev: LandAndFacilities): Color {
    if (isNuclearStrike(laf, prev)) {
        return Color.NUKE;
    }
    return Color.BLUE;
}

function isNuclearStrike(laf: Laf, prev: LandAndFacilities) {
    return laf.land !== prev.land;
}

function compareFacilities(c1: Laf, c2: LandAndFacilities) {
    return (
        c1.country === c2.country &&
        c1.land === c2.land &&
        c1.rigs === c2.rigs &&
        c1.facs === c2.facs &&
        c1.mines === c2.mines &&
        c1.ads === c2.ads &&
        c1.gds === c2.gds
    );
}
