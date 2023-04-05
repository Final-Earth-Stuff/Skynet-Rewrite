import "reflect-metadata";

import { sdk } from "./tracing.js";

import { parser } from "./parser.js";

import { AppDataSource } from "./datasource.js";
export { AppDataSource } from "./datasource.js";

void AppDataSource.initialize().then(async () => {
    const args = parser.parseSync();
    if (args.tracing) {
        sdk.start();
    }
    switch (args._[0]) {
        case "bot": {
            const { bootstrap } = await import("./bot.js");
            await bootstrap(!args.n);
            break;
        }
        case "update_commands": {
            const { updateCommands } = await import(
                "./scripts/updateCommands.js"
            );
            await updateCommands(args.g);
            return process.exit();
        }
        case "update_resources": {
            const { updateStaticData } = await import(
                "./scripts/updateStaticData.js"
            );
            await updateStaticData();
            return process.exit();
        }
    }
});
