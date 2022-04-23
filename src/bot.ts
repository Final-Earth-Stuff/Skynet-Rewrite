import { Client, Intents, MessageEmbed } from "discord.js";

import { schedule } from "node-cron";

import { config } from "./config";
import { makeLogger } from "./logger";
import { BotError } from "./error";
import { Data } from "./map";

import * as decoratorData from "./decorators/data";
import { loadHandlers } from "./decorators";
import { Color } from "./service/util/constants";

const logger = makeLogger(module);

export const bootstrap = async () => {
    logger.info("Starting bot...");

    await Data.shared.initialise();

    logger.info("Loading handlers...");
    const handlers = await loadHandlers();

    const client = new Client({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.GUILD_PRESENCES,
        ],
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
            try {
                const handler = handlers.commands.get(interaction.commandName);
                if (!handler) {
                    throw new Error(
                        `Unknown command: '${interaction.commandName}`
                    );
                }
                logger.debug("Received command '%s'", interaction.commandName);
                await handler._handleCommand(interaction);
            } catch (e) {
                let message: string;
                let ephemeral = false;
                if (e instanceof BotError) {
                    message = e.message;
                    logger.info(
                        "Caught '%s: %s' while processing command '%s'",
                        e.name,
                        e.message,
                        interaction.commandName
                    );
                    ephemeral = e.ephemeral;
                } else {
                    logger.error(
                        "Encountered unexpected error while processing command '%s': %O",
                        interaction.commandName,
                        e
                    );
                    message = "Something went wrong";
                }
                const embed = new MessageEmbed()
                    .setColor(Color.BRIGHT_RED)
                    .setDescription(message);

                if (interaction.deferred) {
                    await interaction.editReply({
                        embeds: [embed],
                    });
                } else {
                    await interaction.reply({
                        embeds: [embed],
                        ephemeral,
                    });
                }
            }
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
                    ].map((handler: CallableFunction) => handler(...args))
                );
            } catch (e) {
                logger.error("Error in event handler '%s': %O", event, e);
            }
        });
    }

    client.login(config.botToken);
};
