import "reflect-metadata";

import { sdk } from "./tracing";

import { parser } from "./parser";

import { AppDataSource } from "./datasource";
export { AppDataSource } from "./datasource";

void AppDataSource.initialize().then(async () => {
    const args = await parser.argv;
    if (args.tracing) {
        await sdk.start();
    }
    switch (args._[0]) {
        case "bot": {
            const { bootstrap } = await import("./bot");
            await bootstrap(!args.n);
            break;
        }
        case "update_commands": {
            const { updateCommands } = await import("./scripts/updateCommands");
            await updateCommands(args.g);
            return process.exit();
        }
        case "update_resources": {
            const { updateStaticData } = await import(
                "./scripts/updateStaticData"
            );
            await updateStaticData();
            return process.exit();
        }
    }
});
