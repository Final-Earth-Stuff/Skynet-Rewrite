import {
    Collection,
    ButtonInteraction,
    CommandInteraction,
    ApplicationCommandData,
    Guild,
} from "discord.js";

import type { SlashCommandBuilder } from "@discordjs/builders";

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
        if (descriptor.value)
            registry.commands.set(options.name, descriptor.value);
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
        if (descriptor.value)
            registry.buttons.set(options.customId, descriptor.value);
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
