import { createLogger, format, transports } from "winston";
import { relative } from "path";

const logFormat = format.combine(format.splat(), format.timestamp());

const logger = createLogger({
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    format: format.combine(logFormat, format.json()),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                logFormat,
                format.printf(({ level, message, timestamp, path }) => {
                    return `${timestamp as string} - ${
                        path as string
                    } [${level}]: ${message}`;
                })
            ),
        }),
        new transports.File({ filename: "bot.log", level: "debug" }),
    ],
});

export const makeLogger = (meta: ImportMeta) =>
    logger.child({ path: relative(import.meta.url, meta.url) });
