/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
    ChatInputCommandInteraction,
    ApplicationCommandData,
} from "discord.js";

import { Constructor, ensureBaseScope } from "./BaseScope";

export type CommandHandlerBody = (
    interaction: ChatInputCommandInteraction
) => Promise<void>;

export const Command =
    () =>
    (
        target: any,
        propertyKey: string,
        _descriptor: TypedPropertyDescriptor<CommandHandlerBody>
    ) => {
        if (Reflect.hasMetadata("handler:command", target.constructor)) {
            throw new Error(
                "`CommandScope` can only have one `@Command` handler"
            );
        }
        if (Reflect.hasMetadata("handler:subcommands", target.constructor)) {
            throw new Error("Cannot combine `@Command` and `@SubCommand`");
        }
        Reflect.defineMetadata(
            "handler:command",
            propertyKey,
            target.constructor
        );
    };

interface SubCommandOptions {
    name: string;
    group?: string;
}

export const SubCommand =
    (options: SubCommandOptions) =>
    (
        target: any,
        propertyKey: string,
        _descriptor: TypedPropertyDescriptor<CommandHandlerBody>
    ) => {
        if (Reflect.hasMetadata("handler:command", target.constructor)) {
            throw new Error("Cannot combine `@Command` and `@SubCommand`");
        }

        const subCommands =
            Reflect.getMetadata("handler:subcommands", target.constructor) ??
            {};
        if (options.group) {
            subCommands[options.group] = [
                ...(subCommands[options.group] ?? []),
                propertyKey,
            ];
        } else {
            subCommands[options.name] = propertyKey;
        }

        Reflect.defineMetadata(
            "handler:subcommands",
            subCommands,
            target.constructor
        );
    };

interface CommandDataOptions {
    type: "global" | "guild";
    completion?: { [id: string]: string };
}

type CommandDataDescription = CommandDataOptions & {
    data: ApplicationCommandData;
};

export const CommandData =
    (options: CommandDataOptions) => (target: any, propertyKey: string) => {
        if (Reflect.hasMetadata("data:command", target.constructor)) {
            throw new Error(
                "`CommandScope` can only specify one `@CommandData`"
            );
        }
        Reflect.defineMetadata("data:command", propertyKey, target.constructor);
        Reflect.defineMetadata(
            "data:command:options",
            options,
            target,
            propertyKey
        );
    };

export interface GuardOptions {
    guildOnly?: boolean;
}
export type GuardFunction = (
    interaction: ChatInputCommandInteraction
) => Promise<void>;

export const Guard =
    (body: GuardFunction, options?: GuardOptions) =>
    <T extends Constructor>(target: T) => {
        const guards = Reflect.getMetadata("handler:guard", target) ?? [];
        guards.push({ ...options, body });
        Reflect.defineMetadata("handler:guard", guards, target);
    };

interface CommandHandlerOptions {
    name: string;
}

export interface ICommandScope {
    readonly _commandName: string;
    readonly _data: CommandDataDescription;
    _handleCommand(interaction: ChatInputCommandInteraction): Promise<void>;
}

export const CommandHandler =
    (options: CommandHandlerOptions) =>
    <T extends Constructor>(target: T) => {
        ensureBaseScope(target);
        Reflect.getMetadata("scope:type", target).add("command");

        const commandHandler = Reflect.getMetadata("handler:command", target);
        let resolveHandler: (
            interaction: ChatInputCommandInteraction
        ) => string;
        if (commandHandler) {
            resolveHandler = (_interaction: ChatInputCommandInteraction) =>
                commandHandler;
        } else {
            const subcommands = Reflect.getMetadata(
                "handler:subcommands",
                target
            );
            if (!subcommands) {
                throw new Error(
                    "`CommandScope` doesn't define `@Command` or `@SubCommand` handlers"
                );
            }
            resolveHandler = (interaction: ChatInputCommandInteraction) => {
                const group = interaction.options.getSubcommandGroup(false);
                if (group) {
                    const subcommandGroup = subcommands[group];
                    if (!subcommandGroup) {
                        throw new Error(`Unknown subcommand group '${group}'`);
                    }

                    const name = interaction.options.getSubcommand(true);
                    const handler = subcommandGroup[name];
                    if (!handler) {
                        throw new Error(
                            `Unknown subcommand '${name}' in group '${group}'`
                        );
                    }
                    return handler;
                } else {
                    const name = interaction.options.getSubcommand(true);
                    const handler = subcommands[name];
                    if (!handler) {
                        throw new Error(
                            `Unknown subcommand '${name}' in group '${group}'`
                        );
                    }
                    return handler;
                }
            };
        }

        const commandData = Reflect.getMetadata("data:command", target);
        if (!commandData) {
            throw new Error("`CommandScope` doesn't expose `@CommandData`");
        }

        const guards = Reflect.getMetadata("handler:guard", target) ?? [];

        return class extends target implements ICommandScope {
            _commandName = options.name;

            get _data(): CommandDataDescription {
                const data = Reflect.get(this, commandData);
                return {
                    data,
                    ...Reflect.getMetadata(
                        "data:command:options",
                        target.prototype,
                        commandData
                    ),
                };
            }

            async _handleCommand(
                interaction: ChatInputCommandInteraction
            ): Promise<void> {
                for (const guard of guards) {
                    if (guard.guildOnly && !interaction.guild) continue;
                    await guard.body(interaction);
                }
                const handler = Reflect.get(this, resolveHandler(interaction));
                await Reflect.apply(handler, this, [interaction]);
            }
        };
    };

export const isCommandHandler = (obj: any): obj is Constructor<ICommandScope> =>
    Reflect.getMetadata("scope:type", obj)?.has("command");
