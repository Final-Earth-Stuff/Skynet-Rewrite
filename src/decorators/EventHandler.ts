import { ClientEvents } from "discord.js";

import { eventHandlers } from "./data";

export type EventKey = keyof ClientEvents;

export interface EventHandlerOptions<K extends EventKey> {
    event: K;
}

export type EventHandlerType<K extends EventKey> = (
    ...args: ClientEvents[K]
) => Promise<void>;

export const EventHandler =
    <K extends keyof ClientEvents>(options: EventHandlerOptions<K>) =>
    (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<EventHandlerType<K>>
    ) => {
        if (!descriptor.value) return;

        const shared = target._shared ?? new target.constructor();
        if (!target._shared) {
            target._shared = shared;
        }

        const handlers = eventHandlers[options.event] ?? [];
        handlers.push(descriptor.value.bind(shared));
        eventHandlers[options.event] = handlers;
    };
