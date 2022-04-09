import { CommandInteraction } from "discord.js";

import { CommandHandler } from "./Command";

export type GuardFunction = (interaction: CommandInteraction) => Promise<void>;

export interface GuardOptions {
    guildOnly?: boolean;
    body: GuardFunction;
}

export const Guard =
    (options: GuardOptions) =>
    (
        _target: unknown,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<CommandHandler>
    ) => {
        const original = descriptor.value;
        descriptor.value = async (interaction: CommandInteraction) => {
            if (options.guildOnly === false || interaction.inGuild()) {
                await options.body(interaction);
            }

            await original?.call(this, interaction);
        };
        return descriptor;
    };
