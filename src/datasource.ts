import { DataSource } from "typeorm";

import { config } from "./config";

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
