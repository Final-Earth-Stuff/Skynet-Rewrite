import { ApplicationCommandOptionChoice } from "discord.js";

import { completionHandlers } from "./data";

export interface AutocompleteOptions {
    id: string;
}

export type AutocompleteHandler = (
    value: string
) => Promise<ApplicationCommandOptionChoice[]>;

export interface CompletionRequest {
    value: string;
}

export const Completion =
    (options: AutocompleteOptions) =>
    (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<AutocompleteHandler>
    ) => {
        const shared = target._shared ?? new target.constructor();
        if (!target._shared) {
            target._shared = shared;
        }
        let handler = descriptor.value;
        if (handler) {
            handler = handler.bind(shared);
            completionHandlers.set(options.id, handler);
        }
    };
