import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
} from "discord.js";

import { CommandHandler, Command, CommandData } from "../../decorators";

import { Color } from "../../service/util/constants";
import type { FormationData } from "../../wrapper/models/formation";
import type {
    ReimbursementInfo,
    Skills,
    UserData,
    PrivateUserData,
} from "../../wrapper/models/user";
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

const logger = makeLogger(import.meta);

@CommandHandler({ name: "personalstats" })
export class PersonalStats {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("personalstats")
        .setDescription("Display your personal stats")
        .toJSON();

    @Command()
    async stats(interaction: ChatInputCommandInteraction): Promise<void> {
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
            logger.warn("API returned error: %O", e);
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
    user: UserData & PrivateUserData,
    apiKey: string
): Promise<EmbedBuilder> {
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

    const days = Math.round((Date.now() / 1000 - user.joined) / 86400);
    return new EmbedBuilder()
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
        .addFields(
            {
                name: "Record",
                value: `${
                    user.personalStats.wins.allies +
                    user.personalStats.wins.axis
                } round wins \n ${user.personalStats.losses} round losses`,
                inline: true,
            },
            {
                name: "Damage",
                value: `$${damage} damage done \n $${losses} losses taken`,
                inline: true,
            },
            {
                name: "Points",
                value: `${getPoints(user)} total points`,
                inline: true,
            },
            {
                name: "Networth",
                value: `$${await calculateNetworth(user, apiKey)} total`,
                inline: true,
            },
            {
                name: "Facilities",
                value: `$${destroyed} worth destroyed \n $${built} worth built`,
                inline: true,
            },
            {
                name: "Age",
                value: `${days} days`,
                inline: true,
            }
        )
        .setColor(Color.BLUE);
}

function getPoints(user: PrivateUserData): number {
    let points = user.points;
    for (const skill in user.skills) {
        if (skill === "queue") {
            points -= 36;
        }
        const n = user.skills[skill as keyof Skills];
        points += (n * (n + 1)) / 2;
    }
    if (user.unlockedUnits?.length !== 0) {
        points += user.unlockedUnits.length * 10;
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

async function calculateNetworth(
    user: PrivateUserData,
    apiKey: string
): Promise<string> {
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
}

function checkForSoldUnits(info: ReimbursementInfo[]): number {
    const now = Date.now() / 1000;
    const amountSold = info
        .filter((reimb) => reimb.type === "SELL_UNITS" && reimb.time > now)
        .reduce((acc, curr) => acc + curr.amount, 0);
    return amountSold;
}
