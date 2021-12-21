import "reflect-metadata";

import { Client, Intents } from "discord.js";
import { createConnection } from "typeorm";

import glob from "glob";
import path from "path";

import { config } from "./config";

import { registry } from "./decorators";
import { makeLogger } from "./logger";

const logger = makeLogger(module);

logger.info("Starting bot");

const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
});

// load handlers...
glob.sync("src/handler/**/*.ts").forEach((match) => {
    const file = path.relative("src", match);
    require("./" + file);
});

logger.debug("registry: %O", registry);

client.on("ready", async (client) => {
    await createConnection();

    if (config.updateGlobals && !config.debug) {
        try {
            const data = registry.globalCommandData.map((factory) => factory());
            await client.application.commands.set(data).then(console.log);
            logger.info("Updated application commands");
        } catch (e) {
            logger.error(
                "Unexpected error while updating global commands: %O",
                e
            );
        }
    }

    if (config.updateGuilds) {
        const guilds = await client.guilds.fetch();
        for (const partialGuild of guilds.values()) {
            try {
                const guild = await partialGuild.fetch();
                const data = registry.guildCommandData.map((factory) =>
                    factory()
                );
                if (config.debug) {
                    data.push(
                        ...registry.globalCommandData.map((factory) =>
                            factory()
                        )
                    );
                }

                await guild.commands.set(data);

                await Promise.all(
                    registry.afterJoinHooks.map((hook) => hook(guild))
                );
            } catch (e) {
                logger.error(
                    "Unexpected error after trying to join guild <id=%s>: %O",
                    partialGuild.id,
                    e
                );
            }
        }
        logger.info("Updated guild commands");
    }

    logger.info("Bot is ready");
});

client.on("guildCreate", async (guild) => {
    try {
        const data = registry.guildCommandData.map((factory) => factory());
        if (config.debug) {
            data.push(
                ...registry.globalCommandData.map((factory) => factory())
            );
        }

        await guild.commands.set(data);

        await Promise.all(registry.afterJoinHooks.map((hook) => hook(guild)));
    } catch (e) {
        logger.error(
            "Unexpected error after trying to join guild <id=%s>: %O",
            guild.id,
            e
        );
    }
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        logger.debug("Received command '%s'", interaction.commandName);
        await registry.commands.get(interaction.commandName)?.(interaction);
    }
    if (interaction.isButton()) {
        logger.debug(
            "Received button interaction for '%s'",
            interaction.customId
        );
        await registry.buttons.get(interaction.customId)?.(interaction);
    }
});

client.login(config.botToken);
