import "reflect-metadata";

import dotenv from "dotenv";
import { readdirSync } from "fs";

import {
    CommandInteraction,
    Client,
    Intents,
    Collection,
    ApplicationCommandData,
} from "discord.js";

dotenv.config();

const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
});

const UPDATE_GLOBAL_COMMANDS = process.argv.includes("--update-globals");
const UPDATE_GUILDS_COMMANDS = process.argv.includes("--update-guilds");

type CommandHandler = {
    data: ApplicationCommandData;
    handler: (interaction: CommandInteraction) => Promise<void>;
    always_register?: boolean;
};

const applicationCommands = new Collection<string, CommandHandler>();
const guildCommands = new Collection<string, CommandHandler>();

readdirSync("./src/command/global")
    .filter((file) => file.endsWith(".ts"))
    .forEach((file) => {
        /* eslint-disable @typescript-eslint/no-var-requires */
        const command = require(`./command/global/${file}`);
        applicationCommands.set(command.data.name, command);
    });

readdirSync("./src/command/guild")
    .filter((file) => file.endsWith(".ts"))
    .forEach((file) => {
        /* eslint-disable @typescript-eslint/no-var-requires */
        const command = require(`./command/guild/${file}`);
        guildCommands.set(command.data.name, command);
    });

const commands = applicationCommands.concat(guildCommands);

const applicationCommandData = [...applicationCommands.values()].map(
    (handler) => handler.data
);

client.on("ready", async (client) => {
    if (UPDATE_GLOBAL_COMMANDS && process.env.NODE_ENV !== "development") {
        await client.application.commands
            .set(applicationCommandData)
            .then(console.log);
        console.log("[index.ts]: Updated application commands");
    }

    if (UPDATE_GUILDS_COMMANDS) {
        const guilds = await client.guilds.fetch();
        const data = [...guildCommands.values()]
            .filter((command) => command.always_register !== false)
            .map((handler) => handler.data);

        if (process.env.NODE_ENV === "development") {
            data.push(...applicationCommandData);
        }

        for (const [snowflake] of guilds) {
            await client.application.commands.set(data, snowflake);
        }
        console.log("[index.ts]: Updated guild commands");
    }

    console.log("[index.ts]: Bot is ready");
});

client.on("guildCreate", async (guild) => {
    const data = [...guildCommands.values()]
        .filter((command) => command.always_register !== false)
        .map((handler) => handler.data);

    if (process.env.NODE_ENV === "development") {
        data.push(...applicationCommandData);
    }

    await guild.commands.set(data);
});

client.on("interactionCreate", (interaction) => {
    if (interaction.isCommand()) {
        commands.get(interaction.commandName)?.handler(interaction);
    }
});

client.login(process.env.BOT_TOKEN);
