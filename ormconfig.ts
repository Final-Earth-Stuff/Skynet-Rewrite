import { config } from "./src/config";

export default {
    type: "postgres",
    synchronize: false,
    host: config.databaseHost,
    port: config.databasePort,
    username: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName,
    entities: ["src/entity/**/*.ts"],
    migrations: ["src/migration/**/*.ts"],
};
