import "reflect-metadata";

import { Client, Intents } from "discord.js";
import { createConnection } from "typeorm";

import glob from "glob";

import { config } from "./config";

import { registry } from "./decorators";

const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
});

// load handlers...
glob.sync("./handlers/**/*.ts").forEach((file) => require(file));

client.on("ready", async (client) => {
    await createConnection();

    if (config.updateGlobals && !config.debug) {
        const data = registry.globalCommandData.map((factory) => factory());
        await client.application.commands.set(data).then(console.log);
        console.log("[index.ts]: Updated application commands");
    }

    if (config.updateGuilds) {
        const guilds = await client.guilds.fetch();
        for (const partialGuild of guilds.values()) {
            const guild = await partialGuild.fetch();
            const data = await Promise.all(
                registry.guildCommandData.map(async (factory) => {
                    const result = factory(guild);
                    if (result instanceof Promise) {
                        return await result;
                    } else {
                        return result;
                    }
                })
            );
            if (config.debug) {
                data.push(
                    ...registry.globalCommandData.map((factory) => factory())
                );
            }

            await guild.commands.set(data);
        }
        console.log("[index.ts]: Updated guild commands");
    }

    console.log("[index.ts]: Bot is ready");
});

client.on("guildCreate", async (guild) => {
    const data = await Promise.all(
        registry.guildCommandData.map(async (factory) => {
            const result = factory(guild);
            if (result instanceof Promise) {
                return await result;
            } else {
                return result;
            }
        })
    );

    if (config.debug) {
        data.push(...registry.globalCommandData.map((factory) => factory()));
    }

    await guild.commands.set(data);
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        await registry.commands.get(interaction.commandName)?.(interaction);
    }
    if (interaction.isButton()) {
        await registry.buttons.get(interaction.customId)?.(interaction);
    }
});

client.login(config.botToken);
