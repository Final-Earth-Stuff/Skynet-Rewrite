import { Client, Intents } from "discord.js";

import { schedule } from "node-cron";

import glob from "glob";
import path from "path";

import { config } from "./config";

import * as decoratorData from "./decorators/data";
import { makeLogger } from "./logger";

import { CommandRepository } from "./repository/CommandRepository";

const logger = makeLogger(module);

logger.info("Starting bot");

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
});

// load handlers...
glob.sync("dist/handler/**/*.js").forEach((match) => {
    const file = path.relative("src", match);
    require("./" + file);
});

client.on("ready", async (client) => {
    if (config.updateGlobals && !config.debug) {
        try {
            const data = decoratorData.globalCommandsData;
            await client.application.commands.set(data);
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
                const data = [...decoratorData.guildCommandsData];
                if (config.debug) {
                    data.push(...decoratorData.globalCommandsData);
                }

                const commands = await guild.commands.set(data);
                await CommandRepository.replaceGuildCommands(
                    commands,
                    partialGuild.id
                );

                await Promise.all(
                    [...decoratorData.updateHooks].map((hook) => hook(guild))
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

    logger.info("Scheduling jobs...");
    decoratorData.jobs.forEach((job, cron) =>
        schedule(cron, () => job(client))
    );

    logger.info("Bot is ready");
});

client.on("guildCreate", async (guild) => {
    try {
        const data = [...decoratorData.guildCommandsData];
        if (config.debug) {
            data.push(...decoratorData.globalCommandsData);
        }

        const commands = await guild.commands.set(data);

        await CommandRepository.replaceGuildCommands(commands, guild.id);
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
        await decoratorData.commands.get(interaction.commandName)?.(
            interaction
        );
    } else if (interaction.isButton()) {
        logger.debug(
            "Received button interaction for '%s'",
            interaction.customId
        );
        await decoratorData.buttons.get(interaction.customId)?.(interaction);
    } else if (interaction.isAutocomplete()) {
        const focused = interaction.options.getFocused(true);
        logger.debug(
            "Received autocompletion interaction for command '%s', option '%s'",
            interaction.commandName,
            focused.name
        );

        const handlerID = decoratorData.optionCompletionMap
            .get(interaction.commandName)
            ?.get(focused.name);

        if (!handlerID) {
            logger.error("No handler registered for requested completion!");
            return;
        }

        const handler = decoratorData.completionHandlers.get(handlerID);

        if (!handler) {
            logger.error("Unknown completion handler with id '%s'!", handlerID);
            return;
        }

        try {
            const completions = await handler(focused.value as string);
            await interaction.respond(completions);
        } catch (e) {
            logger.error(
                "Error in completion handler '%s' while processing value '%s': %O",
                handlerID,
                focused.value,
                e
            );
        }
    }
});

for (const event in decoratorData.eventHandlers) {
    client.on(event, async (...args) => {
        try {
            await Promise.all(
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                (decoratorData.eventHandlers as any)[event].map(
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    (handler: any) => handler(args)
                )
            );
        } catch (e) {
            logger.error("Error in event handler '%s': %O", event, e);
        }
    });
}

export const bootstrap = () => client.login(config.botToken);
