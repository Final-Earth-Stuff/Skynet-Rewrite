import dotenv from "dotenv";

dotenv.config();

const requireEnv = (name: string, fallback?: string): string => {
    const value = process.env[name];
    if (value !== undefined) {
        return value;
    } else if (fallback !== undefined) {
        return fallback;
    } else {
        console.error(`[config.ts]: expected ${name}, but is undefined`);
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
