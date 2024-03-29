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

@CommandHandler({ name: "help" })
export class Help {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("help")
        .setDescription("Help with bot usage")
        .toJSON();

    @Command()
    async help(interaction: ChatInputCommandInteraction): Promise<void> {
        const success = new EmbedBuilder()
            .setTitle("Skynet Help")
            .setDescription(
                `Please check out the Skynet [Wiki](https://github.com/Final-Earth-Stuff/Skynet-Rewrite/wiki) for more information.\n
            Some useful links:
            [Commands](https://github.com/Final-Earth-Stuff/Skynet-Rewrite/wiki/Commands)
            [Setting up the bot in your server](https://github.com/Final-Earth-Stuff/Skynet-Rewrite/wiki/Setting-up-the-bot-in-your-server)
            [FAQ](https://github.com/Final-Earth-Stuff/Skynet-Rewrite/wiki/FAQ)
            `
            )
            .setColor(Color.BLUE);
        await interaction.reply({ embeds: [success] });
    }
}
