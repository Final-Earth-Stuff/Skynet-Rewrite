import { CountryData } from "../wrapper/models/country";
import { LandAndFacilities } from "../entity/LandAndFacilities";
import { Client, MessageEmbed } from "discord.js";
import { AppDataSource } from "..";
import { Guild } from "../entity/Guild";
import { getIcon, convertAxisControl } from "./util/team";
import { Color } from "./util/constants";
import { unwrap } from "../util/assert";

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

    const prev = new Map(prevLand.map((c) => [c.country, c]));

    const embeds = changedLand.map((land) =>
        buildEmbed(land, prev, countryInfo)
    );

    const guildRepository = AppDataSource.getRepository(Guild);
    const guilds = await guildRepository.find();
    await Promise.all(
        guilds.map(async (guild) => {
            if (guild.land_facility_channel) {
                const channel = client.channels.cache.get(
                    guild.land_facility_channel
                );
                if (!channel || !channel.isText()) return;

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
    prevLand: Map<number, LandAndFacilities>,
    countryInfo: Map<number, CountryData>
) {
    const country = unwrap(countryInfo.get(laf.country));
    const prev = unwrap(prevLand.get(laf.country));
    const icon = getIcon(country.controlTeam);
    const control = convertAxisControl(country.control, country.controlTeam);

    const embed = new MessageEmbed()
        .addField("Ground Defenses", `${laf.gds} (${laf.gds - prev.gds})`, true)
        .addField("Air Defenses", `${laf.ads} (${laf.ads - prev.ads})`, true)
        .addField("Factories", `${laf.facs} (${laf.facs - prev.facs})`, true)
        .addField("Mines", `${laf.mines} (${laf.mines - prev.mines})`, true)
        .addField("Oil Rigs", `${laf.rigs} (${laf.rigs - prev.rigs})`, true)
        .setColor(colorForEvent(laf, prev));

    if (isNuclearStrike(laf, prev)) {
        embed
            .setTitle(`Nuclear strike detected in ${country.name}!`)
            .setDescription(`The following was lost in the strike:`)
            .addField("Land", `${laf.land} (${laf.land - prev.land})`, true);
    } else {
        embed
            .setTitle(
                `${icon} ${country?.name} (${control}%) [${country?.region}]`
            )
            .setDescription(`Change in facility count detected:`)
            .addField("\u200B", "\u200B", true);
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
