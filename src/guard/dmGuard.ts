import { CommandInteraction } from "discord.js";

import { BotError } from "../error";

export const dmGuard = async (interaction: CommandInteraction) => {
    if (interaction.channel?.type !== "DM") {
        throw new BotError("This command can only be used in a DM channel");
    }
};