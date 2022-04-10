import { makeLogger } from "../logger";

const logger = makeLogger(module);

type Some<T> = T extends null | undefined ? never : T;

export function assertIsSome<T>(opt: T, msg?: string): asserts opt is Some<T> {
    if (opt === undefined || opt === null) {
        logger.error(msg ?? "Unexpectedly found null or undefined.");
        logger.error(
            "Stack trace:\n%s",
            new Error().stack?.split("\n").slice(2).join("\n")
        );
        process.exit(-1);
    }
}

export function unwrap<T>(opt: T): Some<T> {
    assertIsSome(opt);
    return opt;
}
