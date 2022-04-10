import { CommandInteraction } from "discord.js";

import { AppDataSource } from "..";
import { BotError } from "../error";
import { Guild } from "../entity/Guild";

export const commandChannelGuard = async (interaction: CommandInteraction) => {
    const guild = await AppDataSource.getRepository(Guild).findOneOrFail({
        where: {
            guild_id: interaction.guildId,
        },
        select: {
            command_channels: true,
        },
    });

    if (!guild.command_channels.includes(interaction.channelId)) {
        throw new BotError("This command cannot be used in this channel", {
            ephemeral: true,
        });
    }
};
