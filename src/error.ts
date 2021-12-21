export class BotError extends Error {
    source?: Error;

    constructor(message: string, source?: Error) {
        super(message);
        this.name = "BotError";
        this.source = source;
    }
}
