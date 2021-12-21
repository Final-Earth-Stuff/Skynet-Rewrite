import {
    Collection,
    ButtonInteraction,
    CommandInteraction,
    ApplicationCommandData,
    Guild,
} from "discord.js";

type ButtonHandler = (interaction: ButtonInteraction) => Promise<void>;

type CommandHandler = (interaction: CommandInteraction) => Promise<void>;

type GuildData = (
    guild: Guild
) => Promise<ApplicationCommandData> | ApplicationCommandData;

type GlobalData = () => ApplicationCommandData;

export const registry = {
    buttons: new Collection<string, ButtonHandler>(),
    commands: new Collection<string, CommandHandler>(),
    globalCommandData: new Array<GlobalData>(),
    guildCommandData: new Array<GuildData>(),
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
    id: string;
}

export const Button =
    (options: ButtonOptions) =>
    (
        _target: unknown,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<ButtonHandler>
    ) => {
        if (descriptor.value)
            registry.buttons.set(options.id, descriptor.value);
    };

interface CommandDataOptions {
    register?: boolean;
    type: "global" | "guild";
}

export function CommandData(options: {
    register?: boolean;
    type: "guild";
}): (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
) => void;
export function CommandData(options: {
    register?: boolean;
    type: "global";
}): (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
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
                registry.globalCommandData.push(descriptor.value as GlobalData);
                break;
            case "guild":
                registry.guildCommandData.push(descriptor.value as GuildData);
        }
    };
}
