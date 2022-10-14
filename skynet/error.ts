interface BotErrorOptions {
    source?: Error;
    ephemeral?: boolean;
}

export class BotError extends Error {
    source?: Error;
    ephemeral: boolean;

    constructor(message: string, options?: BotErrorOptions) {
        super(message);
        this.name = "BotError";
        this.source = options?.source;
        this.ephemeral = options?.ephemeral ?? false;
    }
}

export class ApiError extends Error {
    code?: number;

    constructor(message: string, code?: number) {
        super(message);
        this.name = "ApiError";
        this.code = code;
    }
}

type ErrorUser = { type: "fe"; id: number } | { type: "discord"; id: string };

export class NoKeyError extends Error {
    user: ErrorUser;

    constructor(type: "discord", id: string);
    constructor(type: "fe", id: number);
    constructor(type: "discord" | "fe", id: number | string) {
        super(
            type === "discord"
                ? `No key for discord user with id ${id}`
                : `No key for FE user with id ${id}`
        );
        this.user = { type, id } as ErrorUser;
    }
}
