import {
    Collection,
    ButtonInteraction,
    CommandInteraction,
    ApplicationCommandData,
    MessageEmbed,
} from "discord.js";

import type { SlashCommandBuilder } from "@discordjs/builders";

import { makeLogger } from "./logger";
import { BotError } from "./error";

const logger = makeLogger(module);

type ButtonHandler = (interaction: ButtonInteraction) => Promise<void>;

type CommandHandler = (interaction: CommandInteraction) => Promise<void>;

type DataFactory = () => ApplicationCommandData;

export const registry = {
    buttons: new Collection<string, ButtonHandler>(),
    commands: new Collection<string, CommandHandler>(),
    globalCommandData: new Array<DataFactory>(),
    guildCommandData: new Array<DataFactory>(),
};

interface CommandOptions {
    name: string;
}

export const Command =
    (options: CommandOptions) =>
    (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<CommandHandler>
    ) => {
        const shared = target.shared ?? new target.constructor();
        if (!target.shared) {
            target.shared = shared;
        }
        let handler = descriptor.value;
        if (handler) {
            handler = handler.bind(shared);
            const wrapped = async (interaction: CommandInteraction) => {
                try {
                    await handler?.(interaction);
                } catch (e) {
                    if (e instanceof BotError) {
                        const embed = new MessageEmbed()
                            .setColor("#ec3030")
                            .setDescription(e.message);
                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: e.ephemeral,
                        });
                        logger.info(
                            "Caught 'BotError: %s' while processing command '%s'",
                            e.message,
                            options.name
                        );
                        if (e.source) {
                            logger.debug("Source: %O", e.source);
                        }
                    } else {
                        logger.error(
                            "Encountered unexpected error while processing command '%s': %O",
                            options.name,
                            e
                        );
                    }
                }
            };
            registry.commands.set(options.name, wrapped);
        }
    };

interface ButtonOptions {
    customId: string;
}

export const Button =
    (options: ButtonOptions) =>
    (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<ButtonHandler>
    ) => {
        const shared = target.shared ?? new target.constructor();
        if (!target.shared) {
            target.shared = shared;
        }
        let handler = descriptor.value;
        if (handler) {
            handler = handler.bind(shared);
            const wrapped = async (interaction: ButtonInteraction) => {
                try {
                    await handler?.(interaction);
                } catch (e) {
                    if (e instanceof BotError) {
                        const embed = new MessageEmbed()
                            .setColor("#ec3030")
                            .setDescription(e.message);
                        await interaction.followUp({
                            embeds: [embed],
                            ephemeral: e.ephemeral,
                        });
                        logger.info(
                            "Caught 'BotError: %s' while processing button '%s'",
                            e.message,
                            options.customId
                        );
                        if (e.source) {
                            logger.debug("Source: %O", e.source);
                        }
                    } else {
                        logger.error(
                            "Encountered unexpected error while processing button '%s': %O",
                            options.customId,
                            e
                        );
                    }
                }
            };
            registry.buttons.set(options.customId, wrapped);
        }
    };

interface CommandDataOptions {
    type: "global" | "guild";
}

type RESTCommandData = ReturnType<SlashCommandBuilder["toJSON"]>;

type RESTDataFactory = () => RESTCommandData;

export function CommandData(options: CommandDataOptions) {
    return (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<RESTDataFactory>
    ) => {
        if (!descriptor.value) return;

        const shared = target.shared ?? new target.constructor();
        if (!target.shared) {
            target.shared = shared;
        }

        switch (options.type) {
            case "global":
                registry.globalCommandData.push(
                    descriptor.value.bind(shared) as DataFactory
                );
                break;
            case "guild":
                registry.guildCommandData.push(
                    descriptor.value.bind(shared) as DataFactory
                );
        }
    };
}
