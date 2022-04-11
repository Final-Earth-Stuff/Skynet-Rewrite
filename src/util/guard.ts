export type Some<T> = T extends null | undefined ? never : T;

export function isSome<T>(opt: T): opt is Some<T> {
    return opt !== undefined && opt !== null;
}
