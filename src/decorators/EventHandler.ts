/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EventEmitter } from "node:events";
import type { ClientEvents } from "discord.js";

import { Constructor, ensureBaseScope } from "./BaseScope";

import { makeLogger } from "../logger";

const logger = makeLogger(import.meta);

type DiscordEventKey = keyof ClientEvents;

type DiscordEventHandlerType<K extends DiscordEventKey> = (
    ...args: ClientEvents[K]
) => Promise<void>;

export const DiscordEvent =
    <K extends DiscordEventKey>(event: K) =>
    (
        target: any,
        propertyKey: string,
        _descriptor: TypedPropertyDescriptor<DiscordEventHandlerType<K>>
    ) => {
        const handlers =
            Reflect.getMetadata("handler:event:discord", target.constructor) ??
            new Set<string>();
        handlers.add(propertyKey);
        Reflect.defineMetadata(
            "handler:event:discord",
            handlers,
            target.constructor
        );
        Reflect.defineMetadata(
            "data:discord:options",
            event,
            target,
            propertyKey
        );
    };

/* eslint-disable-next-line @typescript-eslint/no-empty-interface */
interface BotEvents {}

type BotEventKey = keyof BotEvents;

type BotEventHandlerType<K extends BotEventKey> = (
    ...args: BotEvents[K]
) => Promise<void>;

export const BotEvent =
    <K extends BotEventKey>(event: K) =>
    (
        target: any,
        propertyKey: string,
        _descriptor: TypedPropertyDescriptor<BotEventHandlerType<K>>
    ) => {
        const handlers =
            Reflect.getMetadata("handler:event:bot", target.constructor) ??
            new Set<string>();
        handlers.add(propertyKey);
        Reflect.defineMetadata(
            "handler:event:bot",
            handlers,
            target.constructor
        );
        Reflect.defineMetadata("data:bot:options", event, target, propertyKey);
    };

export interface IEventHandlerScope {
    _registerDiscordHandlers(emitter: EventEmitter): void;
    _registerBotHandlers(emitter: EventEmitter): void;
}

export const EventHandler =
    () =>
    <T extends Constructor>(target: T) => {
        ensureBaseScope(target);
        Reflect.getMetadata("scope:type", target).add("event");

        return class extends target implements IEventHandlerScope {
            _registerBotHandlers(emitter: EventEmitter): void {
                const handlers: Set<string> =
                    Reflect.getMetadata("handler:event:bot", target) ??
                    new Set();

                for (const handler of handlers) {
                    const event = Reflect.getMetadata(
                        "data:bot:options",
                        target.prototype,
                        handler
                    );
                    const body = Reflect.get(this, handler);

                    emitter.on(event, (...args) =>
                        Promise.resolve({
                            then: (resolve: any) =>
                                resolve(body.apply(this, args)),
                        }).catch((error) =>
                            logger.error(
                                "Error in '%s' handler of '%s': %O",
                                event,
                                target.name,
                                error
                            )
                        )
                    );
                }
            }

            _registerDiscordHandlers(emitter: EventEmitter): void {
                const handlers: Set<string> =
                    Reflect.getMetadata("handler:event:discord", target) ??
                    new Set();

                for (const handler of handlers) {
                    const event = Reflect.getMetadata(
                        "data:discord:options",
                        target.prototype,
                        handler
                    );
                    const body = Reflect.get(this, handler);

                    emitter.on(event, (...args) =>
                        Promise.resolve({
                            then: (resolve: any) =>
                                resolve(body.apply(this, args)),
                        }).catch((error) =>
                            logger.error(
                                "Error in '%s' handler of '%s': %O",
                                event,
                                target.name,
                                error
                            )
                        )
                    );
                }
            }
        };
    };

export const isEventHandler = (
    obj: any
): obj is Constructor<IEventHandlerScope> =>
    Reflect.getMetadata("scope:type", obj)?.has("event");
