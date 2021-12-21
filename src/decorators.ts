import {
    Collection,
    ButtonInteraction,
    CommandInteraction,
    ApplicationCommandData,
    Guild,
    MessageEmbed,
} from "discord.js";

import type { SlashCommandBuilder } from "@discordjs/builders";

import { makeLogger } from "./logger";
import { BotError } from "./error";

const logger = makeLogger(module);

type ButtonHandler = (interaction: ButtonInteraction) => Promise<void>;

type CommandHandler = (interaction: CommandInteraction) => Promise<void>;

type GuildDataFactory = (
    guild: Guild
) => Promise<ApplicationCommandData> | ApplicationCommandData;

type GlobalDataFactory = () => ApplicationCommandData;

export const registry = {
    buttons: new Collection<string, ButtonHandler>(),
    commands: new Collection<string, CommandHandler>(),
    globalCommandData: new Array<GlobalDataFactory>(),
    guildCommandData: new Array<GuildDataFactory>(),
};

interface CommandOptions {
    name: string;
}

export const Command =
    (options: CommandOptions) =>
    (
        _target: unknown,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<CommandHandler>
    ) => {
        const handler = descriptor.value;
        if (handler) {
            const wrapped = async (interaction: CommandInteraction) => {
                try {
                    await handler(interaction);
                } catch (e) {
                    if (e instanceof BotError) {
                        const embed = new MessageEmbed()
                            .setColor("#ec3030")
                            .setDescription(e.message);
                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: true,
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
        _target: unknown,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<ButtonHandler>
    ) => {
        const handler = descriptor.value;
        if (handler) {
            const wrapped = async (interaction: ButtonInteraction) => {
                try {
                    await handler(interaction);
                } catch (e) {
                    if (e instanceof BotError) {
                        const embed = new MessageEmbed()
                            .setColor("#ec3030")
                            .setDescription(e.message);
                        await interaction.followUp({
                            embeds: [embed],
                            ephemeral: true,
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
    register?: boolean;
    type: "global" | "guild";
}

type RESTCommandData = ReturnType<SlashCommandBuilder["toJSON"]>;

type GlobalRESTDataFactory = () => RESTCommandData;

type GuildRESTDataFactory = (guild: Guild) => RESTCommandData;

type GuildAsyncRESTDataFactory = (guild: Guild) => Promise<RESTCommandData>;

export function CommandData(options: { register?: boolean; type: "guild" }): {
    (
        target: unknown,
        propertyKey: string,
        descriptor: TypedPropertyDescriptor<GuildRESTDataFactory>
    ): void;
    (
        target: unknown,
        propertyKey: string,
        descriptor: TypedPropertyDescriptor<GuildAsyncRESTDataFactory>
    ): void;
};
export function CommandData(options: {
    register?: boolean;
    type: "global";
}): (
    target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<GlobalRESTDataFactory>
) => void;
export function CommandData(options: CommandDataOptions) {
    return (
        _target: unknown,
        _propertyKey: string,
        descriptor: PropertyDescriptor
    ) => {
        if (options.register === false) return;

        switch (options.type) {
            case "global":
                registry.globalCommandData.push(
                    descriptor.value as GlobalDataFactory
                );
                break;
            case "guild":
                registry.guildCommandData.push(
                    descriptor.value as GuildDataFactory
                );
        }
    };
}
