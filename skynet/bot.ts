import {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    InteractionType,
    Routes,
} from "discord.js";

import node_cron from "node-cron";
const { schedule } = node_cron;

import { ROOT_CONTEXT, SpanKind, SpanStatusCode } from "@opentelemetry/api";

import { config } from "./config";
import { makeLogger } from "./logger";
import { ApiError, BotError, NoKeyError } from "./error";
import { Data } from "./map/index";

import { loadHandlers } from "./decorators/index";
import { Color } from "./service/util/constants";
import { withNewSpan } from "./tracing";

import { ApiWrapper } from "./wrapper/wrapper";

ApiWrapper.forRaw("");

const logger = makeLogger(import.meta);

export let handlers: Awaited<ReturnType<typeof loadHandlers>> | undefined =
    undefined;

export const bootstrap = async (jobs: boolean) => {
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

    client.on("ready", (client) => {
        if (jobs) {
            logger.info("Scheduling jobs...");
            handlers?.cronJobs.forEach((cronJobs, cron) =>
                schedule(cron, () =>
                    cronJobs.forEach((job) => {
                        Promise.resolve(
                            (async () => {
                                await withNewSpan(
                                    `job.${job.label}`,
                                    {
                                        attributes: { "job.cron": cron },
                                    },
                                    ROOT_CONTEXT,
                                    () => job(client)
                                );
                            })()
                        ).catch((e) =>
                            logger.error(
                                "Error while executing scheduled job: %O",
                                e
                            )
                        );
                    })
                )
            );
        }

        logger.info("Bot is ready");
    });

    handlers.events.forEach((handler) =>
        handler._registerDiscordHandlers(client)
    );

    client.on("interactionCreate", async (interaction) => {
        await withNewSpan(
            "client.interactionCreate",
            {
                attributes: {
                    ["discord.interaction.id"]: interaction.id,
                    ["discord.interaction.type"]: interaction.type,
                    ["discord.interaction.guild_id"]:
                        interaction.guildId ?? "None",
                },
                kind: SpanKind.INTERNAL,
            },
            ROOT_CONTEXT,
            async (span) => {
                try {
                    switch (interaction.type) {
                        case InteractionType.ApplicationCommand: {
                            if (interaction.isContextMenuCommand()) {
                                logger.error(
                                    "Received context menu application command interaction for command '%s'",
                                    interaction.commandName
                                );
                                return;
                            }
                            await withNewSpan(
                                `command.${interaction.commandName}`,
                                {},
                                async (span) => {
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
                                        await handler._handleCommand(
                                            interaction
                                        );
                                    } catch (e) {
                                        let ephemeral = false;
                                        const embed =
                                            new EmbedBuilder().setColor(
                                                Color.BRIGHT_RED
                                            );
                                        if (e instanceof BotError) {
                                            embed.setDescription(e.message);
                                            logger.warn(
                                                "Caught '%s: %s' while processing command '%s'",
                                                e.name,
                                                e.message,
                                                interaction.commandName
                                            );
                                            ephemeral = e.ephemeral;
                                            span.addEvent("BotError response", {
                                                message: e.message,
                                            });
                                        } else if (e instanceof NoKeyError) {
                                            embed.setDescription(
                                                "This command requires your API key.\nPlease DM the bot and use the `/start` command in order to use this feature."
                                            );
                                        } else if (e instanceof ApiError) {
                                            embed
                                                .setDescription(
                                                    `The API returned an error`
                                                )
                                                .setFields(
                                                    {
                                                        name: "reason",
                                                        value: e.message,
                                                        inline: true,
                                                    },
                                                    {
                                                        name: "Code",
                                                        value:
                                                            e.code?.toString() ??
                                                            "N/A",
                                                        inline: true,
                                                    }
                                                );
                                        } else {
                                            logger.error(
                                                "Encountered unexpected error while processing command '%s': %O",
                                                interaction.commandName,
                                                e
                                            );
                                            embed
                                                .setDescription(
                                                    "Something went wrong"
                                                )
                                                .setFooter({
                                                    text: `trace ID: ${
                                                        span.spanContext()
                                                            .traceId
                                                    }`,
                                                });
                                            span.recordException(
                                                e instanceof Error
                                                    ? e
                                                    : JSON.stringify(e)
                                            );
                                            span.setStatus({
                                                code: SpanStatusCode.ERROR,
                                                message: "Internal error",
                                            });
                                        }

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
                                }
                            );
                            break;
                        }
                        case InteractionType.MessageComponent:
                            await withNewSpan(
                                "component handler",
                                {
                                    attributes: {
                                        "discord.component.custom_id":
                                            interaction.customId,
                                    },
                                },
                                ROOT_CONTEXT,
                                async (span) => {
                                    if (!interaction.isButton()) {
                                        logger.error(
                                            "Received message component interaction of wrong type: %s",
                                            interaction.type
                                        );
                                        return;
                                    }
                                    try {
                                        const handler = handlers?.buttons.get(
                                            interaction.customId
                                        );
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
                                        const embed =
                                            new EmbedBuilder().setColor(
                                                Color.BRIGHT_RED
                                            );
                                        let ephemeral = false;
                                        if (e instanceof BotError) {
                                            embed.setDescription(e.message);
                                            logger.info(
                                                "Caught '%s: %s' while processing button '%s'",
                                                e.name,
                                                e.message,
                                                interaction.customId
                                            );
                                            span.addEvent(
                                                "Replying with bot error",
                                                {
                                                    message: e.message,
                                                }
                                            );
                                            ephemeral = e.ephemeral;
                                        } else {
                                            logger.error(
                                                "Encountered unexpected error while processing button '%s': %O",
                                                interaction.customId,
                                                e
                                            );
                                            span.recordException(
                                                e instanceof Error
                                                    ? e
                                                    : JSON.stringify(e)
                                            );
                                            span.setStatus({
                                                code: SpanStatusCode.ERROR,
                                            });
                                            embed
                                                .setDescription(
                                                    "Something went wrong"
                                                )
                                                .setFooter({
                                                    text: `trace ID: ${
                                                        span.spanContext()
                                                            .traceId
                                                    }`,
                                                });
                                        }

                                        await interaction.followUp({
                                            embeds: [embed],
                                            ephemeral,
                                        });
                                    }
                                }
                            );
                            break;
                        case InteractionType.ApplicationCommandAutocomplete:
                            {
                                await withNewSpan(
                                    "autocompletion handler",
                                    {
                                        attributes: {
                                            "discord.autocompletion.command_name":
                                                interaction.commandName,
                                        },
                                    },
                                    ROOT_CONTEXT,
                                    async (span) => {
                                        const focused =
                                            interaction.options.getFocused(
                                                true
                                            );
                                        span.setAttribute(
                                            "discord.autocompletion.focused",
                                            focused.name
                                        );
                                        logger.debug(
                                            "Received autocompletion interaction for command '%s', option '%s'",
                                            interaction.commandName,
                                            focused.name
                                        );

                                        const handlerID =
                                            handlers?.completionMap
                                                .get(interaction.commandName)
                                                ?.get(focused.name);

                                        if (!handlerID) {
                                            logger.error(
                                                "No handler registered for requested completion!"
                                            );
                                            return;
                                        }

                                        const handler =
                                            handlers?.completions.get(
                                                handlerID
                                            );

                                        if (!handler) {
                                            logger.error(
                                                "Unknown completion handler with id '%s'!",
                                                handlerID
                                            );
                                            return;
                                        }

                                        try {
                                            const completions =
                                                await handler._handle(
                                                    handlerID,
                                                    focused.value
                                                );
                                            await interaction.respond(
                                                completions
                                            );
                                        } catch (e) {
                                            if (e instanceof Error) {
                                                span.recordException(e);
                                            }
                                            logger.error(
                                                "Error in completion handler '%s' while processing value '%s': %O",
                                                handlerID,
                                                focused.value,
                                                e
                                            );
                                        }
                                    }
                                );
                            }
                            break;
                        default:
                            logger.error(
                                "Received interaction of unknown type '%s'",
                                interaction.type
                            );
                            return;
                    }
                } catch (e) {
                    span.recordException(
                        e instanceof Error ? e : JSON.stringify(e)
                    );
                    span.setStatus({ code: SpanStatusCode.ERROR });
                }
            }
        );
    });

    await client.login(config.botToken);

    await client.rest.get(Routes.oauth2CurrentApplication());
};
