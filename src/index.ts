import "reflect-metadata";

import { DataSource } from "typeorm";

import { config } from "./config";
import { parser } from "./parser";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: config.databaseHost,
    port: config.databasePort,
    username: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName,
    synchronize: true,
    entities: ["dist/entity/**/*.js"],
    migrations: ["dist/migration/**/*.js"],
});

AppDataSource.initialize().then(async () => {
    const args = await parser.argv;
    switch (args._[0]) {
        case "bot": {
            const { bootstrap } = await import("./bot");
            bootstrap();
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
