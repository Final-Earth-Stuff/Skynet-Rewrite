import glob from "glob";

import { isCommandHandler } from "./CommandHandler.js";
import { isEventHandler } from "./EventHandler.js";
import { isButtonHandler } from "./Button.js";
import { isCompletionProvider } from "./Completion.js";
import { isScheduledJob, JobHandle } from "./ScheduledJob.js";

export * from "./Button.js";
export * from "./EventHandler.js";
export * from "./CommandHandler.js";
export * from "./ScheduledJob.js";
export * from "./Completion.js";

export async function loadHandlers() {
    const exports = [];
    for (const match of glob.sync("handler/**/*.js", { cwd: "dist/skynet" })) {
        exports.push(
            ...Object.values(
                (await import(`../${match}`)) as Record<string, unknown>
            )
        );
    }

    const commandScopes = exports
        .filter(isCommandHandler)
        .map((constr) => new constr());

    const globalData = commandScopes
        .filter((scope) => scope._data.type === "global")
        .map((scope) => scope._data.data);

    const guildData = commandScopes
        .filter((scope) => scope._data.type === "guild")
        .map((scope) => scope._data.data);

    const completionMap = new Map(
        commandScopes
            .filter((scope) => scope._data.completion)
            .map((scope) => [
                scope._commandName,
                /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
                new Map(Object.entries(scope._data.completion!)),
            ])
    );

    const eventHandlers = exports
        .filter(isEventHandler)
        .map((constr) => new constr());

    const buttonHandlers = exports
        .filter(isButtonHandler)
        .map((constr) => new constr());

    const completionProviders = exports
        .filter(isCompletionProvider)
        .map((constr) => new constr());

    const scheduledJobs = exports
        .filter(isScheduledJob)
        .map((constr) => new constr());

    const mergedJobs = scheduledJobs
        .map((job) => job._cronJobs)
        .reduce((acc, cronJobs) => {
            cronJobs.forEach((jobs, cron) => {
                const list = acc.get(cron) ?? [];
                list.push(...jobs);
                acc.set(cron, list);
            });
            return acc;
        }, new Map<string, JobHandle[]>());

    return {
        commands: new Map(
            commandScopes.map((scope) => [scope._commandName, scope])
        ),
        completionMap,
        events: eventHandlers,
        buttons: new Map(
            buttonHandlers.flatMap((handler) =>
                [...handler._handles].map((customId) => [customId, handler])
            )
        ),
        completions: new Map(
            completionProviders.flatMap((handler) =>
                [...handler._handles].map((id) => [id, handler])
            )
        ),
        cronJobs: mergedJobs,
        globalData,
        guildData,
    };
}
