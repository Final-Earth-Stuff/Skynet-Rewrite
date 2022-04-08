import dotenv from "dotenv";
import yargs from "yargs";

import { makeLogger } from "./logger";

const logger = makeLogger(module);

dotenv.config();

const requireEnv = (name: string, fallback?: string): string => {
    const value = process.env[name];
    if (value !== undefined) {
        return value;
    } else if (fallback !== undefined) {
        return fallback;
    } else {
        logger.error("expected %s, but is undefined", name);
        process.exit(1);
    }
};

export const config = {
    debug: process.env.NODE_ENV === "development",

    botToken: requireEnv("BOT_TOKEN"),

    apiKey: requireEnv("API_KEY"),

    databaseName: requireEnv("DATABASE_NAME"),
    databaseUser: requireEnv("DATABASE_USER"),
    databasePassword: requireEnv("DATABASE_PASSWORD"),
    databaseHost: requireEnv("DATABASE_HOST", "localhost"),
    databasePort: parseInt(requireEnv("DATABASE_PORT", "5432")),

    updateGlobals: process.argv.includes("--update-globals"),
    updateGuilds: process.argv.includes("--update-guilds"),
};

export const parser = yargs(process.argv.slice(2))
    .usage("Usage: $0 <command> [options]")
    .help("h")
    .alias("h", "help")
    .command("bot", "Run the bot")
    .command(
        "update_commands",
        "Update the discord slash command definitions",
        (yargs) =>
            yargs.options({
                g: {
                    alias: "globals-to-guilds",
                    type: "boolean",
                    default: false,
                    desc: "Write global commands to guilds instead for debugging purposes",
                },
            })
    )
    .command("refresh_resources", "Update static resources")
    .demandCommand(1);
