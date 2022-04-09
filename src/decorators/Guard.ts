import { CommandInteraction } from "discord.js";

import { CommandHandler } from "./Command";

export type GuardFunction = (interaction: CommandInteraction) => Promise<void>;

export interface GuardOptions {
    guildOnly?: boolean;
    body: GuardFunction;
}

export const CommandData =
    (options: GuardOptions) =>
    (
        _target: unknown,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<CommandHandler>
    ) =>
    async (interaction: CommandInteraction) => {
        if (
            (options.guildOnly || options.guildOnly === undefined) &&
            interaction.inGuild()
        )
            return;

        await options.body(interaction);

        await descriptor.value?.(interaction);
    };
