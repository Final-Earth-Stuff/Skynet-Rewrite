/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
export type Constructor<T = {}> = new (...args: any[]) => T;

export const BaseScope = (target: any): any => {
    Reflect.defineMetadata("scope:type", new Set(), target);
    return class extends target {
        constructor(...args: any) {
            super(args);
            Object.freeze(this);
        }
    };
};

export function ensureBaseScope(target: any) {
    if (!Reflect.hasMetadata("scope:type", target)) {
        Reflect.decorate([BaseScope], target);
    }
}
