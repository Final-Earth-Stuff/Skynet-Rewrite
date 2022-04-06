import { Guild } from "discord.js";

import { updateHooks } from "./data";

export type UpdateHook = (guild: Guild) => Promise<void>;

export const AfterCommandUpdate =
    () =>
    (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<UpdateHook>
    ) => {
        if (!descriptor.value) return;

        const shared = target._shared ?? new target.constructor();
        if (!target._shared) {
            target._shared = shared;
        }

        updateHooks.add(descriptor.value.bind(shared));
    };
