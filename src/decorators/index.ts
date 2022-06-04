import glob from "glob";
import path from "path";

import { isCommandHandler } from "./CommandHandler";
import { isEventHandler } from "./EventHandler";
import { isButtonHandler } from "./Button";
import { isCompletionProvider } from "./Completion";

export * from "./Button";
export * from "./EventHandler";
export * from "./CommandHandler";
export * from "./AfterCommandUpdate";
export * from "./ScheduledJob";
export * from "./Completion";

export async function loadHandlers() {
    const exports = [];
    for (const match of glob.sync("dist/handler/**/*.js")) {
        const file = path.relative(module.path, match);
        exports.push(...Object.values(await import("./" + file)));
    }

    const commandScopes = exports
        .filter(isCommandHandler)
        .map((constr) => new constr());

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
    };
}
