import { config } from "./src/config";

export default {
    type: "postgres",
    host: config.databaseHost,
    port: config.databasePort,
    username: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName,
    synchronize: true,
    entities: ["src/entity/**/*.ts"],
    migrations: ["src/migration/**/*.ts"],
};
