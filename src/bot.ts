import {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    InteractionType,
} from "discord.js";

import { schedule } from "node-cron";

import { config } from "./config";
import { makeLogger } from "./logger";
import { BotError } from "./error";
import { Data } from "./map";

import { loadHandlers } from "./decorators";
import { Color } from "./service/util/constants";

const logger = makeLogger(module);

export let handlers: Awaited<ReturnType<typeof loadHandlers>> | undefined =
    undefined;

export const bootstrap = async () => {
    logger.info("Starting bot...");

    await Data.shared.initialise();

    logger.info("Loading handlers...");
    handlers = await loadHandlers();

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildPresences,
        ],
    });

    client.on("ready", async (client) => {
        logger.info("Scheduling jobs...");
        handlers?.cronJobs.forEach((cronJobs, cron) =>
            schedule(cron, () =>
                cronJobs.forEach((job) => {
                    Promise.resolve({
                        then: (resolve: CallableFunction) => {
                            resolve(job(client));
                        },
                    }).catch((e) =>
                        logger.error(
                            "Error while executing scheduled job: %O",
                            e
                        )
                    );
                })
            )
        );

        logger.info("Bot is ready");
    });

    handlers.events.forEach((handler) =>
        handler._registerDiscordHandlers(client)
    );

    client.on("interactionCreate", async (interaction) => {
        switch (interaction.type) {
            case InteractionType.ApplicationCommand:
                if (interaction.isContextMenuCommand()) {
                    logger.error(
                        "Received context menu application command interaction for command '%s'",
                        interaction.commandName
                    );
                    return;
                }
                try {
                    const handler = handlers?.commands.get(
                        interaction.commandName
                    );
                    if (!handler) {
                        throw new Error(
                            `Unknown command: '${interaction.commandName}`
                        );
                    }
                    logger.debug(
                        "Received command '%s'",
                        interaction.commandName
                    );
                    await handler._handleCommand(interaction);
                } catch (e) {
                    let message: string;
                    let ephemeral = false;
                    if (e instanceof BotError) {
                        message = e.message;
                        logger.warn(
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
                    const embed = new EmbedBuilder()
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
                break;
            case InteractionType.MessageComponent:
                if (!interaction.isButton()) {
                    logger.error(
                        "Received message component interaction of wrong type: %s",
                        interaction.type
                    );
                    return;
                }
                try {
                    const handler = handlers?.buttons.get(interaction.customId);
                    if (!handler) {
                        throw new Error(
                            `Unknown button: '${interaction.customId}`
                        );
                    }
                    logger.debug(
                        "Received button interaction for '%s'",
                        interaction.customId
                    );
                    await handler._handle(interaction);
                } catch (e) {
                    let message: string;
                    let ephemeral = false;
                    if (e instanceof BotError) {
                        message = e.message;
                        logger.info(
                            "Caught '%s: %s' while processing button '%s'",
                            e.name,
                            e.message,
                            interaction.customId
                        );
                        ephemeral = e.ephemeral;
                    } else {
                        logger.error(
                            "Encountered unexpected error while processing button '%s': %O",
                            interaction.customId,
                            e
                        );
                        message = "Something went wrong";
                    }
                    const embed = new EmbedBuilder()
                        .setColor(Color.BRIGHT_RED)
                        .setDescription(message);

                    await interaction.followUp({
                        embeds: [embed],
                        ephemeral,
                    });
                }
                break;
            case InteractionType.ApplicationCommandAutocomplete:
                {
                    const focused = interaction.options.getFocused(true);
                    logger.debug(
                        "Received autocompletion interaction for command '%s', option '%s'",
                        interaction.commandName,
                        focused.name
                    );

                    const handlerID = handlers?.completionMap
                        .get(interaction.commandName)
                        ?.get(focused.name);

                    if (!handlerID) {
                        logger.error(
                            "No handler registered for requested completion!"
                        );
                        return;
                    }

                    const handler = handlers?.completions.get(handlerID);

                    if (!handler) {
                        logger.error(
                            "Unknown completion handler with id '%s'!",
                            handlerID
                        );
                        return;
                    }

                    try {
                        const completions = await handler._handle(
                            handlerID,
                            focused.value as string
                        );
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
                break;
            default:
                logger.error(
                    "Received interaction of unknown type '%s'",
                    interaction.type
                );
                return;
        }
    });

    client.login(config.botToken);
};
