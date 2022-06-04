import glob from "glob";
import path from "path";

import { isCommandHandler } from "./CommandHandler";
import { isEventHandler } from "./EventHandler";
import { isButtonHandler } from "./Button";

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

    const eventHandlers = exports
        .filter(isEventHandler)
        .map((constr) => new constr());

    const buttonHandlers = exports
        .filter(isButtonHandler)
        .map((constr) => new constr());

    return {
        commands: new Map(
            commandScopes.map((scope) => [scope._commandName, scope])
        ),
        events: eventHandlers,
        buttons: new Map(
            buttonHandlers.flatMap((handler) =>
                [...handler._handles].map((customId) => [customId, handler])
            )
        ),
    };
}
