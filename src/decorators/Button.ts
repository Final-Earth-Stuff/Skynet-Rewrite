/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ButtonInteraction } from "discord.js";

import { Constructor, ensureBaseScope } from "./BaseScope";

export interface ButtonOptions {
    customId: string;
}

export type ButtonHandlerBody = (
    interaction: ButtonInteraction
) => Promise<void>;

export const Button =
    (options: ButtonOptions) =>
    (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        target: any,
        propertyKey: string,
        _descriptor: TypedPropertyDescriptor<ButtonHandlerBody>
    ) => {
        const handlers: Map<string, string> =
            Reflect.getMetadata("handler:button", target.constructor) ??
            new Map();
        handlers.set(options.customId, propertyKey);
        Reflect.defineMetadata("handler:button", handlers, target.constructor);
    };

export interface IButtonHandlerScope {
    _handles: Set<string>;

    _handle(interaction: ButtonInteraction): Promise<void>;
}

export const ButtonHandler =
    () =>
    <T extends Constructor>(target: T) => {
        ensureBaseScope(target);
        Reflect.getMetadata("scope:type", target).add("button");

        const handlerMap: Map<string, string> =
            Reflect.getMetadata("handler:button", target) ?? new Map();

        return class extends target implements IButtonHandlerScope {
            get _handles(): Set<string> {
                return new Set(handlerMap.keys());
            }

            async _handle(interaction: ButtonInteraction): Promise<void> {
                const key = handlerMap.get(interaction.customId);
                if (!key) return;

                Reflect.get(this, key).call(this, interaction);
            }
        };
    };

export const isButtonHandler = (
    obj: any
): obj is Constructor<IButtonHandlerScope> =>
    Reflect.getMetadata("scope:type", obj)?.has("button");
