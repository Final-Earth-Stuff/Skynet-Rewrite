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
    label: string;
}

interface JobRecord {
    key: string;
    label: string;
}

export type JobHandle = JobBody & { label: string };

export const Cron =
    (options: ScheduledJobOptions) =>
    (
        target: any,
        propertyKey: string,
        _descriptor: TypedPropertyDescriptor<JobBody>
    ) => {
        const handlers: Map<string, JobRecord[]> =
            Reflect.getMetadata("handler:cron", target.constructor) ??
            new Map();
        const cronHandlers = handlers.get(options.cron) ?? [];
        handlers.set(options.cron, [
            ...cronHandlers,
            { key: propertyKey, label: options.label },
        ]);
        Reflect.defineMetadata("handler:cron", handlers, target.constructor);
    };

export interface IScheduledJob {
    _cronJobs: Map<string, JobHandle[]>;
}

export const ScheduledJob =
    () =>
    <T extends Constructor>(target: T) => {
        ensureBaseScope(target);
        Reflect.getMetadata("scope:type", target).add("scheduled_job");

        const cronMap: Map<string, JobRecord[]> = Reflect.getMetadata(
            "handler:cron",
            target
        );

        return class extends target implements IScheduledJob {
            get _cronJobs(): Map<string, JobHandle[]> {
                return new Map(
                    [...cronMap.entries()].map(([cron, handles]) => [
                        cron,
                        handles.map((handle) => {
                            const handler = Reflect.get(this, handle.key).bind(
                                this
                            );
                            handler.label = handle.label;

                            return handler;
                        }),
                    ])
                );
            }
        };
    };

export const isScheduledJob = (obj: any): obj is Constructor<IScheduledJob> =>
    Reflect.getMetadata("scope:type", obj)?.has("scheduled_job");
