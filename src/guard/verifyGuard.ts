import { CommandInteraction } from "discord.js";

import { AppDataSource } from "..";
import { BotError } from "../error";
import { Guild } from "../entity/Guild";

export const verifyGuard = async (interaction: CommandInteraction) => {
    const guild = await AppDataSource.getRepository(Guild).findOneOrFail({
        where: {
            guild_id: interaction.guildId ?? "",
        },
        select: {
            verify_channel: true,
        },
    });

    if (interaction.channelId !== guild.verify_channel) {
        if (guild.verify_channel) {
            const channel = await interaction.guild?.channels.fetch(
                guild.verify_channel
            );
            if (channel && channel.members.has(interaction.user.id)) {
                throw new BotError(
                    `This command can only be used in <#${guild.verify_channel}>`,
                    { ephemeral: true }
                );
            }
        }
        throw new BotError("This command cannot be used in this channel", {
            ephemeral: true,
        });
    }
};
