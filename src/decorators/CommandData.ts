import { SlashCommandBuilder } from "@discordjs/builders";
import { ApplicationCommandData, Collection } from "discord.js";

import {
    globalCommandsData,
    guildCommandsData,
    optionCompletionMap,
} from "./data";

export interface CommandDataOptions {
    type: "global" | "guild";
    completions?: {
        [key: string]: string;
    };
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

        const data = descriptor.value.call(shared) as ApplicationCommandData;

        switch (options.type) {
            case "global":
                globalCommandsData.push(data);
                break;
            case "guild":
                guildCommandsData.push(data);
        }

        if (options.completions) {
            for (const option in options.completions) {
                const optionMap =
                    optionCompletionMap.get(data.name) ?? new Collection();
                optionMap.set(option, options.completions[option]);
                optionCompletionMap.set(data.name, optionMap);
            }
        }
    };
}
