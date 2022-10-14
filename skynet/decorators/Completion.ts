/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApplicationCommandOptionChoiceData } from "discord.js";
import { Constructor, ensureBaseScope } from "./BaseScope";

type AutocompleteHandler = (
    value: string
) => Promise<ApplicationCommandOptionChoiceData[]>;

export const Completion =
    (id: string) =>
    (
        target: any,
        propertyKey: string,
        _descriptor: TypedPropertyDescriptor<AutocompleteHandler>
    ) => {
        const completions =
            Reflect.getMetadata("handler:completion", target.constructor) ??
            new Set<string>();
        completions.add(propertyKey);
        Reflect.defineMetadata(
            "handler:completion",
            completions,
            target.constructor
        );
        Reflect.defineMetadata(
            "data:completion:options",
            id,
            target,
            propertyKey
        );
    };

export interface ICompletionProvider {
    _handles: Set<string>;
    _handle(
        id: string,
        value: string
    ): Promise<ApplicationCommandOptionChoiceData[]>;
}

export const CompletionProvider =
    () =>
    <T extends Constructor>(target: T) => {
        ensureBaseScope(target);
        Reflect.getMetadata("scope:type", target).add("completion");

        const completions: Set<string> = Reflect.getMetadata(
            "handler:completion",
            target
        );
        const complMap = new Map(
            [...completions].map((completion) => [
                Reflect.getMetadata(
                    "data:completion:options",
                    target.prototype,
                    completion
                ),
                completion,
            ])
        );

        return class extends target implements ICompletionProvider {
            _handles = new Set(complMap.keys());

            async _handle(
                id: string,
                value: string
            ): Promise<ApplicationCommandOptionChoiceData[]> {
                const key = complMap.get(id);
                if (!key) {
                    throw new Error(`Unknown completion with id \`${id}\``);
                }

                return await Reflect.get(this, key).call(this, value);
            }
        };
    };

export const isCompletionProvider = (
    obj: any
): obj is Constructor<ICompletionProvider> =>
    Reflect.getMetadata("scope:type", obj)?.has("completion");
