import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";

registerInstrumentations({
    instrumentations: [new PgInstrumentation()],
});

import { DataSource } from "typeorm";

import { config } from "./config";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: config.databaseHost,
    port: config.databasePort,
    username: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName,
    synchronize: false,
    entities: ["dist/skynet/entity/**/*.js"],
    migrations: ["dist/skynet/migration/**/*.js"],
});
