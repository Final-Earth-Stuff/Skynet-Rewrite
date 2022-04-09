import glob from "glob";
import path from "path";

import { Client, Intents } from "discord.js";

import { schedule } from "node-cron";

import { config } from "./config";

import * as decoratorData from "./decorators/data";
import { makeLogger } from "./logger";

import { CommandRepository } from "./repository/CommandRepository";

const logger = makeLogger(module);

export const bootstrap = () => {
    logger.info("Starting bot...");

    logger.info("Loading handlers...");
    glob.sync("dist/handler/**/*.js").forEach((match) => {
        const file = path.relative(module.path, match);
        require("./" + file);
    });

    const client = new Client({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
    });

    client.on("ready", async (client) => {
        logger.info("Scheduling jobs...");
        decoratorData.jobs.forEach((cronJobs, cron) =>
            schedule(cron, () => cronJobs.forEach((job) => job(client)))
        );

        logger.info("Bot is ready");
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
            await decoratorData.buttons.get(interaction.customId)?.(
                interaction
            );
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
                logger.error(
                    "Unknown completion handler with id '%s'!",
                    handlerID
                );
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
                    decoratorData.eventHandlers[
                        event as keyof typeof decoratorData.eventHandlers
                    ].map((handler) => handler(...(args as never[])))

                );
            } catch (e) {
                logger.error("Error in event handler '%s': %O", event, e);
            }
        });
    }

    client.login(config.botToken);
};
