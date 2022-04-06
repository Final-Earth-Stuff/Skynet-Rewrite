import { CommandInteraction, MessageEmbed } from "discord.js";

import { ApiError, BotError } from "../error";
import { makeLogger } from "../logger";

import { commands, adminCommands } from "./data";

const logger = makeLogger(module);

export interface CommandOptions {
    name: string;
    admin?: boolean;
}

export type CommandHandler = (interaction: CommandInteraction) => Promise<void>;

export const Command =
    (options: CommandOptions) =>
    (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<CommandHandler>
    ) => {
        if (options.admin) {
            adminCommands.add(options.name);
        }

        const shared = target._shared ?? new target.constructor();
        if (!target._shared) {
            target._shared = shared;
        }
        let handler = descriptor.value;
        if (handler) {
            handler = handler.bind(shared);
            const wrapped = async (interaction: CommandInteraction) => {
                try {
                    await handler?.(interaction).catch(async (e) => {
                        let message: string;
                        if (e instanceof BotError || e instanceof ApiError) {
                            message = e.message;
                            logger.info(
                                "Caught '%s: %s' while processing command '%s'",
                                e.name,
                                e.message,
                                options.name
                            );
                        } else {
                            logger.error(
                                "Encountered unexpected error while processing command '%s': %O",
                                options.name,
                                e
                            );
                            message = "Something went wrong";
                        }
                        const embed = new MessageEmbed()
                            .setColor("#ec3030")
                            .setDescription(message);

                        if (interaction.deferred) {
                            await interaction.editReply({
                                embeds: [embed],
                            });
                        } else {
                            await interaction.reply({
                                embeds: [embed],
                                ephemeral: e.ephemeral,
                            });
                        }
                    });
                } catch (e) {
                    logger.error(
                        "Something went very wrong while handling command '%s': %O",
                        options.name,
                        e
                    );
                }
            };
            commands.set(options.name, wrapped);
        }
    };
