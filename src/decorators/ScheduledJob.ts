/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any*/
import type { Client } from "discord.js";
import { Constructor, ensureBaseScope } from "./BaseScope";

export type JobBody = (guild: Client) => Promise<void>;

export interface ScheduledJobOptions {
    cron: string;
}

export const Cron =
    (cron: string) =>
    (
        target: any,
        propertyKey: string,
        _descriptor: TypedPropertyDescriptor<JobBody>
    ) => {
        const handlers: Map<string, string[]> =
            Reflect.getMetadata("handler:cron", target.constructor) ??
            new Map();
        const cronHandlers = handlers.get(cron) ?? [];
        handlers.set(cron, [...cronHandlers, propertyKey]);
        Reflect.defineMetadata("handler:cron", handlers, target.constructor);
    };

export interface IScheduledJob {
    _cronJobs: Map<string, JobBody[]>;
}

export const ScheduledJob =
    () =>
    <T extends Constructor>(target: T) => {
        ensureBaseScope(target);
        Reflect.getMetadata("scope:type", target).add("scheduled_job");

        const cronMap: Map<string, string[]> = Reflect.getMetadata(
            "handler:cron",
            target
        );

        return class extends target implements IScheduledJob {
            get _cronJobs() {
                return new Map(
                    [...cronMap.entries()].map(([cron, keys]) => [
                        cron,
                        keys.map((key) => Reflect.get(this, key).bind(this)),
                    ])
                );
            }
        };
    };

export const isScheduledJob = (obj: any): obj is Constructor<IScheduledJob> =>
    Reflect.getMetadata("scope:type", obj)?.has("scheduled_job");
