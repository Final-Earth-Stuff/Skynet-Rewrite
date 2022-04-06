import { SlashCommandBuilder } from "@discordjs/builders";
import { ApplicationCommandData } from "discord.js";

import { globalCommandsData, guildCommandsData } from "./data";

export interface CommandDataOptions {
    type: "global" | "guild";
}

export type DataFactory = () => ApplicationCommandData;

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

        const shared = target._shared ?? new target.constructor();
        if (!target._shared) {
            target._shared = shared;
        }

        switch (options.type) {
            case "global":
                globalCommandsData.add(
                    descriptor.value.bind(shared) as DataFactory
                );
                break;
            case "guild":
                guildCommandsData.add(
                    descriptor.value.bind(shared) as DataFactory
                );
        }
    };
}
