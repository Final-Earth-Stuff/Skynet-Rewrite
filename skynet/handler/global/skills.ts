import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
} from "discord.js";

import { CommandHandler, Command, CommandData } from "../../decorators";

import { Color } from "../../service/util/constants";
import { ApiWrapper } from "../../wrapper/wrapper";
import { rankMap } from "../../service/util/constants";

@CommandHandler({ name: "skills" })
export class Profile {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("skills")
        .setDescription("Display your unlocked skills")
        .toJSON();

    @Command()
    async profile(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();
        const userWrapper = await ApiWrapper.forDiscordId(interaction.user.id);

        await interaction.editReply({
            embeds: [await buildSkillsEmbed(userWrapper)],
        });
    }
}

async function buildSkillsEmbed(wrapper: ApiWrapper): Promise<EmbedBuilder> {
    const user = await wrapper.getUser();
    const rank = rankMap.get(user.rank) ?? "";

    const pointsSpent = Object.entries(user.skills).reduce(
        (total, [s, p]) => total + (p * (p + 1)) / 2 - (s === "queue" ? 36 : 0),
        0
    );

    return new EmbedBuilder()
        .setTitle(`${rank} ${user.name} [${user.id}]`)
        .setDescription(
            `${pointsSpent} points spent on improving skills with ${user.points} points remaining.`
        )
        .addFields(
            {
                name: "Operations",
                value: `${user.skills.operations}/25`,
                inline: true,
            },
            {
                name: "Foot ATK",
                value: `${user.skills.footAttack}/25`,
                inline: true,
            },
            {
                name: "Foot DEF",
                value: `${user.skills.footDefence}/25`,
                inline: true,
            },
            {
                name: "Land ATK",
                value: `${user.skills.landAttack}/25`,
                inline: true,
            },
            {
                name: "Land DEF",
                value: `${user.skills.landDefence}/25`,
                inline: true,
            },
            {
                name: "Queue",
                value: `${user.skills.queue}/25`,
                inline: true,
            },
            {
                name: "Air ATK",
                value: `${user.skills.airAttack}/25`,
                inline: true,
            },
            {
                name: "Air DEF",
                value: `${user.skills.airAttack}/25`,
                inline: true,
            },
            {
                name: "Land DEF",
                value: `${user.skills.landDefence}/25`,
                inline: true,
            },
            {
                name: "Travel",
                value: `${user.skills.travelTime}/25`,
                inline: true,
            },
            {
                name: "Naval ATK",
                value: `${user.skills.navalAttack}/25`,
                inline: true,
            },
            {
                name: "Land DEF",
                value: `${user.skills.navalDefence}/25`,
                inline: true,
            }
        )
        .setColor(Color.BLUE);
}
