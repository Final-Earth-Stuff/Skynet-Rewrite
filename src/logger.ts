import { createLogger, format, transports } from "winston";
import { basename } from "path";

import { config } from "./config";

const logFormat = format.combine(format.splat(), format.timestamp());

const logger = createLogger({
    level: config.debug ? "debug" : "info",
    format: format.combine(logFormat, format.json()),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                logFormat,
                format.printf(({ level, message, timestamp, basename }) => {
                    return `${timestamp} - ${basename} [${level}]: ${message}`;
                })
            ),
        }),
        new transports.File({ filename: "bot.log", level: "info" }),
    ],
});

export const makeLogger = (mod: { filename: string }) =>
    logger.child({ file: mod.filename, basename: basename(mod.filename) });
