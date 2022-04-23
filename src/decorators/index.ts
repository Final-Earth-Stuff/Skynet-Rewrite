import glob from "glob";
import path from "path";

import { isCommandScope } from "./CommandScope";

export * from "./Command";
export * from "./Button";
export * from "./CommandData";
export * from "./EventHandler";
export * from "./AfterCommandUpdate";
export * from "./ScheduledJob";
export * from "./Completion";
export * from "./Guard";

export async function loadHandlers() {
    const exports = [];
    for (const match of glob.sync("dist/handler/**/*.js")) {
        const file = path.relative(module.path, match);
        exports.push(...Object.values(await import("./" + file)));
    }

    const commandScopes = exports
        .filter(isCommandScope)
        .map((constr) => new constr());

    return {
        commands: new Map(
            commandScopes.map((scope) => [scope._commandName, scope])
        ),
    };
}
