import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
} from "discord.js";

import {
    CommandHandler,
    Command,
    CommandData,
} from "../../decorators/index.js";

import { Color } from "../../service/util/constants.js";
import type { FormationData } from "../../wrapper/models/formation.js";
import type {
    ReimbursementInfo,
    Skills,
    UserData,
    PrivateUserData,
} from "../../wrapper/models/user.js";
import { ApiWrapper } from "../../wrapper/wrapper.js";
import { rankMap } from "../../service/util/constants.js";
import { makeLogger } from "../../logger.js";

const logger = makeLogger(import.meta);

@CommandHandler({ name: "profile" })
export class Profile {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Display your profile stats")
        .addBooleanOption((option) =>
            option
                .setName("redact-nw")
                .setDescription("Hide your networth")
                .setRequired(false)
        )
        .toJSON();

    @Command()
    async profile(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();
        const redactNw = interaction.options.getBoolean("redact-nw") ?? false;
        const userWrapper = await ApiWrapper.forDiscordId(interaction.user.id);

        await interaction.editReply({
            embeds: [await buildStatsEmbed(userWrapper, redactNw)],
        });
    }
}

async function buildStatsEmbed(
    wrapper: ApiWrapper,
    redactNw: boolean
): Promise<EmbedBuilder> {
    const user = await wrapper.getUser();
    let formation: FormationData | undefined;
    try {
        formation = await wrapper.getFormation();
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
                value: redactNw
                    ? `||REDACTED||`
                    : `$${await calculateNetworth(user, wrapper)} total`,
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
    if (user.unlockedUnits.length !== 0) {
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
    wrapper: ApiWrapper
): Promise<string> {
    const units = await wrapper.getUnits();
    const allUnits = await wrapper.getAllUnits();

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
        .filter(
            (reimb) =>
                reimb.type === "SELL_UNITS" && reimb.time && reimb.time > now
        )
        .reduce((acc, curr) => acc + curr.amount, 0);
    return amountSold;
}
