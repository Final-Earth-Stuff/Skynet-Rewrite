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
    constructor(message: string) {
        super(message);
        this.name = "ApiError";
    }
}