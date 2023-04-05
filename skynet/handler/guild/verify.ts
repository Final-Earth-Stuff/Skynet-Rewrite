import {
    CommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";

import {
    CommandHandler,
    Command,
    CommandData,
    Guard,
} from "../../decorators/index.js";
import { ApiWrapper } from "../../wrapper/wrapper.js";
import { BotError, ApiError } from "../../error.js";
import { verifyGuard } from "../../guard/verifyGuard.js";

import { Color } from "../../service/util/constants.js";
import {
    updateRoleAndNickname,
    getGuild,
    resetMember,
} from "../../service/verifyService.js";
import { isRoundOver } from "../../service/util/team.js";
import { UserData } from "../../wrapper/models/user.js";

@CommandHandler({ name: "verify" })
@Guard(verifyGuard)
export class Verify {
    @CommandData({ type: "guild" })
    readonly data = new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Verify User")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("User to verify")
                .setRequired(false)
        )
        .toJSON();

    @Command()
    async totals(interaction: CommandInteraction) {
        await interaction.deferReply();
        if (!interaction.guild)
            throw new BotError("Command needs to be run in a guild");

        const userId =
            interaction.options.getUser("user")?.id ?? interaction.user.id;

        const member = await interaction.guild.members.fetch(userId);
        const guild = await getGuild(interaction.guildId ?? "");

        let user: UserData;
        try {
            user = await ApiWrapper.bot.getUser(userId);
        } catch (e) {
            if (e instanceof ApiError && e.code == 2) {
                await resetMember(member, guild);
                throw new BotError(
                    `This discord account is not verified with Final Earth.
                    Please visit [here](https://www.finalearth.com/discord) and follow the instructions.`
                );
            } else {
                throw e;
            }
        }

        if (!guild.allies_role || !guild.axis_role || !guild.spectator_role)
            throw new BotError("Roles are not configured for this guild");

        const world = await ApiWrapper.bot.getWorld();
        const roundOver = isRoundOver(world);

        try {
            await updateRoleAndNickname(user, guild, member, roundOver);
        } catch (e) {
            throw new BotError("Role could not be assigned!");
        }

        const embed = new EmbedBuilder()
            .setAuthor({
                name: user.name,
                iconURL: member.user.displayAvatarURL(),
            })
            .setDescription(`Successfully verified user ${member.user.tag}!`)
            .setColor(Color.GREEN);

        await interaction.editReply({ embeds: [embed] });
    }
}
