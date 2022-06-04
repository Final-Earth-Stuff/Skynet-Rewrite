import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { CommandHandler, Command, CommandData } from "../../decorators";

import { Color } from "../../service/util/constants";
import { FormationData } from "../../wrapper/models/formation";
import { ReimbursementInfo, Skills, UserData } from "../../wrapper/models/user";
import {
    getUser,
    getFormation,
    getUnits,
    getAllUnits,
} from "../../wrapper/wrapper";
import { rankMap } from "../../service/util/constants";
import { UserSettingsRepository } from "../../repository/UserSettingsRepository";
import { ApiError, BotError } from "../../error";
import { makeLogger } from "../../logger";

const logger = makeLogger(module);

@CommandHandler({ name: "personalstats" })
export class PersonalStats {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("personalstats")
        .setDescription("Display your personal stats")
        .toJSON();

    @Command()
    async stats(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const user = await UserSettingsRepository.getUserByDiscordId(
            interaction.user.id
        );

        if (!user || !user.valid_key || !user.api_key) {
            throw new BotError(
                "Please DM the bot the /start command to store  your API key in order to use this feature."
            );
        }
        let userData;
        try {
            userData = await getUser(user.api_key);
        } catch (e) {
            if (e instanceof ApiError && e.code === 1) {
                throw new BotError(
                    "This is not a valid API key, please check your key and try again."
                );
            }
            throw new BotError(
                "Something went wrong with calling the API, please check your key and try again."
            );
        }

        await interaction.editReply({
            embeds: [await buildStatsEmbed(userData, user.api_key)],
        });
    }
}

async function buildStatsEmbed(
    user: UserData,
    apiKey: string
): Promise<MessageEmbed> {
    let formation: FormationData | undefined;
    try {
        formation = await getFormation(apiKey);
    } catch (e) {
        logger.error(e);
    }
    const rank = rankMap.get(user.rank) ?? "";
    const formatter = Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 2,
    });
    const damage = formatter.format(user.personalStats.assaults.damageDealt);
    const losses = formatter.format(
        user.personalStats.assaults.lossesSustained
    );
    const destroyed = formatter.format(user.personalStats.facilities.destroyed);
    const built = formatter.format(user.personalStats.facilities.spend);
    return new MessageEmbed()
        .setTitle(`${rank} ${user.name} [${user.id}]`)
        .setDescription(
            `${
                formation
                    ? getFormationStr(formation, user)
                    : "Not currently in a Formation"
            } | ${user.motto ? `Motto: ${user.motto} |` : ""} Elo: ${
                user.rating
            }`
        )
        .addField(
            "Record",
            `${
                user.personalStats.wins.allies + user.personalStats.wins.axis
            } round wins \n ${user.personalStats.losses} round losses`,
            true
        )
        .addField(
            "Damage",
            `$${damage} damage done \n $${losses} losses taken`,
            true
        )
        .addField("Points", `${getPoints(user)} total points`, true)
        .addField(
            "Networth",
            `$${await calculateNetworth(user, apiKey)} total`,
            true
        )
        .addField(
            "Facilities",
            `$${destroyed} worth destroyed \n $${built} worth built`,
            true
        )
        .addField("\u200B", "\u200B", true)
        .setColor(Color.BLUE);
}

function getPoints(user: UserData): number {
    let points = user.points;
    for (const skill in user.skills) {
        if (skill === "queue") {
            points -= 36;
        }
        const n = user.skills[skill as keyof Skills];
        points += (n * (n + 1)) / 2;
    }
    return points;
}

function getFormationStr(formation: FormationData, user: UserData): string {
    const position = getFormationPosition(formation, user.id.toString());
    return `${position} of *${formation.name}* (${formation.members.length} members)`;
}

function getFormationPosition(formation: FormationData, id: string): string {
    if (formation.leader === id) {
        return "Leader";
    } else if (formation.coleader === id) {
        return "Co-Leader";
    } else {
        return "Member";
    }
}

async function calculateNetworth(user: UserData, apiKey: string) {
    try {
        const units = await getUnits(apiKey);
        const allUnits = await getAllUnits(apiKey);

        let total = units
            .map((unit) => {
                const unitInfo = allUnits.find((u) => u.id === unit.id);
                if (!unitInfo) {
                    throw new Error("Unit not found");
                }
                return unitInfo.cost * unit.quantity;
            })
            .reduce((a, b) => a + b, 0);

        total += user.funds;
        total += user.reimbursement.amount;
        total += checkForSoldUnits(user.reimbursement.fullInformation);
        const formatter = Intl.NumberFormat("en", {
            notation: "compact",
            maximumFractionDigits: 2,
        });
        return formatter.format(total);
    } catch (e) {
        logger.error(e);
    }
}

function checkForSoldUnits(info: ReimbursementInfo[]): number {
    const now = Date.now() / 1000;
    const amountSold = info
        .filter((reimb) => reimb.type === "SELL_UNITS" && reimb.time > now)
        .reduce((acc, curr) => acc + curr.amount, 0);
    return amountSold;
}
