import "reflect-metadata";

import { parser } from "./parser";

import { AppDataSource } from "./datasource";
export { AppDataSource } from "./datasource";

require("./decorators/CommandScope");

AppDataSource.initialize().then(async () => {
    const args = await parser.argv;
    switch (args._[0]) {
        case "bot": {
            const { bootstrap } = await import("./bot");
            await bootstrap();
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
