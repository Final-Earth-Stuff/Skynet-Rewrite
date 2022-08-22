import {
    CommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";

import { CommandHandler, Command, CommandData, Guard } from "../../decorators";
import { getUser, getWorld } from "../../wrapper/wrapper";
import { config } from "../../config";
import { BotError, ApiError } from "../../error";
import { verifyGuard } from "../../guard/verifyGuard";

import { Color } from "../../service/util/constants";
import { updateRoleAndNickname, getGuild } from "../../service/verifyService";
import { isRoundOver } from "../../service/util/team";

@CommandHandler({ name: "verify" })
@Guard(verifyGuard)
export class Verify {
    @CommandData({ type: "guild" })
    readonly data = new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Verify User")
        .toJSON();

    @Command()
    async totals(interaction: CommandInteraction) {
        await interaction.deferReply();
        if (!interaction.guild)
            throw new BotError("Command needs to be run in a guild");

        const user = await getUser(config.apiKey, interaction.user.id).catch(
            (e) => {
                if (e instanceof ApiError && e.code == 2) {
                    throw new BotError(
                        `Your discord account is not verified with Final Earth.
                    Please visit [here](https://www.finalearth.com/discord) and follow the instructions.`
                    );
                } else {
                    throw e;
                }
            }
        );

        const guild = await getGuild(interaction.guildId ?? "");

        if (!guild.allies_role || !guild.axis_role || !guild.spectator_role)
            throw new BotError("Roles are not configured for this guild");

        const member = await interaction.guild.members.fetch(
            interaction.user.id
        );

        const world = await getWorld(config.apiKey);
        const roundOver = isRoundOver(world);

        try {
            await updateRoleAndNickname(user, guild, member, roundOver);
        } catch (e) {
            throw new BotError("Role could not be assigned!");
        }

        const embed = new EmbedBuilder()
            .setAuthor({
                name: user.name,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setDescription(
                `Successfully verified user ${interaction.user.tag}!`
            )
            .setColor(Color.GREEN);

        await interaction.editReply({ embeds: [embed] });
    }
}
