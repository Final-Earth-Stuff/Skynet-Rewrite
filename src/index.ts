import "reflect-metadata";

import glob from "glob";
import path from "path";

import { DataSource } from "typeorm";

import { config, parser } from "./config";

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

import { bootstrap } from "./bot";
import { updateCommands } from "./scripts/updateCommands";

// load handlers...
glob.sync("dist/handler/**/*.js").forEach((match) => {
    const file = path.relative("src", match);
    require("./" + file);
});

AppDataSource.initialize().then(async () => {
    const args = await parser.argv;
    switch (args._[0]) {
        case "bot":
            bootstrap();
            break;
        case "update_commands":
            await updateCommands(args.g);
            break;
        case "update_resources":
    }
});
