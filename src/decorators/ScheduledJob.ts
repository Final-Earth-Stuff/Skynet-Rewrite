import { Client } from "discord.js";

import { jobs } from "./data";

export type JobBody = (guild: Client) => Promise<void>;

export interface ScheduledJobOptions {
    cron: string;
}

export const ScheduledJob =
    (options: ScheduledJobOptions) =>
    (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<JobBody>
    ) => {
        if (!descriptor.value) return;

        const shared = target._shared ?? new target.constructor();
        if (!target._shared) {
            target._shared = shared;
        }

        const cronJobs = jobs.get(options.cron) ?? [];
        cronJobs.push(descriptor.value.bind(shared));
        jobs.set(options.cron, cronJobs);
    };
