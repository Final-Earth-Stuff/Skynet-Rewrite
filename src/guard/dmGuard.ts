import { CommandInteraction } from "discord.js";

import { BotError } from "../error";

export const dmGuard = async (interaction: CommandInteraction) => {
    const channel = await interaction.client.channels.fetch(
        interaction.channelId
    );
    if (!channel || channel.type !== "DM") {
        throw new BotError("This command can only be used in a DM channel");
    }
};
