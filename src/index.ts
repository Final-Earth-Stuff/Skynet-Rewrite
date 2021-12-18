import "reflect-metadata";

import { readdirSync } from "fs";

import {
    CommandInteraction,
    Client,
    Intents,
    Collection,
    ApplicationCommandData,
} from "discord.js";
import { createConnection } from "typeorm";

import { config } from "./config";

import { handleButton } from "./command/global/settings";

const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
});

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
    await createConnection();

    if (config.updateGlobals && !config.debug) {
        await client.application.commands
            .set(applicationCommandData)
            .then(console.log);
        console.log("[index.ts]: Updated application commands");
    }

    if (config.updateGuilds) {
        const guilds = await client.guilds.fetch();
        const data = [...guildCommands.values()]
            .filter((command) => command.always_register !== false)
            .map((handler) => handler.data);

        if (config.debug) {
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

client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        console.log(
            `[index.ts]: Received command '${interaction.commandName}'`
        );
        await commands.get(interaction.commandName)?.handler(interaction);
    }
    if (interaction.isButton()) {
        handleButton(interaction);
    }
});

client.login(config.botToken);
