import { UnitChange } from "../entity/UnitChange";
import { CountryData } from "../wrapper/models/country";
import { Client, TextChannel, MessageEmbed } from "discord.js";
import { AppDataSource } from "..";
import { Guild } from "../entity/Guild";
import { getIcon, convertAxisControl, getColor } from "./util/team";
import { Color } from "./util/constants";

const countryInfo: Map<number, CountryData> = new Map();

type Units = Omit<UnitChange, "id">;

export function changedUnitsFromWorld(
    world: CountryData[],
    prevUnits: UnitChange[]
): Units[] {
    return world.reduce((acc: Units[], country) => {
        const prev = prevUnits.find(
            (units) => parseInt(country.id) === units.country
        );
        if (prev && !compareUnits(country, prev)) {
            countryInfo.set(parseInt(country.id), country);
            acc.push(buildUnitChange(country, prev));
        }
        return acc;
    }, []);
}

export function detectOrigin(changedWorld: Units[]): Units[] {
    const duplicatesToRemove: number[] = [];

    const addedPrevCountry = changedWorld.map((c1) => {
        const allies = changedWorld.find((c2) => linkMovement(c1.delta_allies, c2.delta_allies));
        if (allies?.country && allies.country !== c1.country) {
            c1.previous_country = allies?.country;
            duplicatesToRemove.push(c1.previous_country)
        }

        const axis = changedWorld.find((c2) => linkMovement(c1.delta_axis, c2.delta_axis));
        if (axis?.country && axis.country !== c1.country) {
            c1.previous_country = axis?.country;
            duplicatesToRemove.push(c1.previous_country)
        }
        return c1;
    });

    return addedPrevCountry.filter(
        (country) =>{
            return !duplicatesToRemove.includes(country.country)
        } 
    );
}

export async function prepareAndSendMessage(
    _client: Client,
    changedUnits: Units[]
) {
    const guildRepository = AppDataSource.getRepository(Guild);
    const guilds = await guildRepository.find();
    guilds.forEach(async (guild) => {
        if (guild.troop_movement_channel) {
            const channel: TextChannel = _client.channels.cache.get(
                guild.troop_movement_channel
            ) as TextChannel;

            changedUnits.forEach(async (unit) => {
                sendTMMessage(unit, channel);
            });
        }
    });
}

function sendTMMessage(unit: Units, channel: TextChannel) {
    const country = countryInfo.get(unit.country);
    const icon = getIcon(country?.controlTeam ?? 0);
    const control = getControl(country)
    const team = unit.delta_allies !== 0 ? 1 : 2;

    const embed = new MessageEmbed()
        .setTitle(
            `${icon} ${country?.name} (${control}%) [${country?.region}]`
        )
        .setDescription(
            unit.previous_country
                ? getEmbedDesc(unit)
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

function getEmbedDesc(unit: Units) {
    const prevCountry = countryInfo.get(unit.previous_country ?? 0);
    const prevIcon = getIcon(prevCountry?.controlTeam ?? 0);
    const teamName = unit.delta_allies !== 0 ? "Allied" : "Axis";
    const control = getControl(prevCountry);

    return `${teamName} units have arrived from ${prevIcon} ${prevCountry?.name} (${control}%) (?-?mins)`;
}

function getControl(country: CountryData | undefined) {
    return convertAxisControl(
        country?.control ?? 0,
        country?.controlTeam ?? 0
    );
}

function compareUnits(u1: CountryData, u2: UnitChange): boolean {
    return u1.units.axis === u2.axis && u1.units.allies === u2.allies;
}

function buildUnitChange(country: CountryData, prev: UnitChange) {
    return {
        country: parseInt(country.id),
        axis: country.units.axis,
        allies: country.units.allies,
        delta_axis: country.units.axis - (prev?.axis ?? 0),
        delta_allies: country.units.allies - (prev?.allies ?? 0),
        timestamp: new Date(),
    };
}

function linkMovement(d1: number, d2: number) {
    return d1 > 0 && Math.abs(d1) === Math.abs(d2);
}
