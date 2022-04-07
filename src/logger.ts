import { createLogger, format, transports } from "winston";
import { relative } from "path";

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
                format.printf(({ level, message, timestamp, path }) => {
                    return `${timestamp} - ${path} [${level}]: ${message}`;
                })
            ),
        }),
        new transports.File({ filename: "bot.log", level: "info" }),
    ],
});

export const makeLogger = (mod: NodeModule) =>
    logger.child({ path: relative(module.path, mod.filename) });
