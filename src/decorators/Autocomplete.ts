import { AutocompleteInteraction } from "discord.js";

import { ApiError, BotError } from "../error";
import { makeLogger } from "../logger";

import { completionHandlers } from "./data";

const logger = makeLogger(module);

export interface AutocompleteOptions {
    commandName?: string;
}

export type AutocompleteHandler = (
    interaction: AutocompleteInteraction
) => Promise<void>;

export const Autocomplete =
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
            const wrapped = async (interaction: AutocompleteInteraction) => {
                await handler?.(interaction).catch(async (e) => {
                    if (e instanceof BotError || e instanceof ApiError) {
                        logger.info(
                            "Caught '%s: %s' while processing completion for command '%s'",
                            e.name,
                            e.message,
                            options.commandName
                        );
                    } else {
                        logger.error(
                            "Encountered unexpected error while processing completion for command '%s': %O",
                            options.commandName,
                            e
                        );
                    }
                });
            };
            completionHandlers.set(options.commandName, wrapped);
        }
    };
