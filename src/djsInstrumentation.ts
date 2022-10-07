/* eslint-disable @typescript-eslint/unbound-method */
import {
    InstrumentationBase,
    InstrumentationConfig,
    InstrumentationModuleDefinition,
    InstrumentationNodeModuleDefinition,
    isWrapped,
} from "@opentelemetry/instrumentation";

import type { REST } from "@discordjs/rest";
import { SpanKind, SpanStatusCode } from "@opentelemetry/api";

const djsRestVersion = ["1.*"];

export class DjsInstrumentation extends InstrumentationBase {
    constructor(config: InstrumentationConfig = {}) {
        super("opentelemetry-discordjs-instrumentation", "0.0.1", config);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected init(): InstrumentationModuleDefinition<any>[] {
        return [
            new InstrumentationNodeModuleDefinition<{ REST: typeof REST }>(
                "@discordjs/rest",
                djsRestVersion,
                (moduleExports) => {
                    if (isWrapped(moduleExports.REST.prototype.get)) {
                        this._unwrap(moduleExports.REST.prototype, "get");
                    }
                    if (isWrapped(moduleExports.REST.prototype.post)) {
                        this._unwrap(moduleExports.REST.prototype, "post");
                    }
                    if (isWrapped(moduleExports.REST.prototype.put)) {
                        this._unwrap(moduleExports.REST.prototype, "put");
                    }
                    if (isWrapped(moduleExports.REST.prototype.patch)) {
                        this._unwrap(moduleExports.REST.prototype, "patch");
                    }
                    if (isWrapped(moduleExports.REST.prototype.delete)) {
                        this._unwrap(moduleExports.REST.prototype, "delete");
                    }
                    this._wrap(
                        moduleExports.REST.prototype,
                        "get",
                        this._getPatchedRequest("get")
                    );
                    this._wrap(
                        moduleExports.REST.prototype,
                        "post",
                        this._getPatchedRequest("post")
                    );
                    this._wrap(
                        moduleExports.REST.prototype,
                        "put",
                        this._getPatchedRequest("put")
                    );
                    this._wrap(
                        moduleExports.REST.prototype,
                        "patch",
                        this._getPatchedRequest("patch")
                    );
                    this._wrap(
                        moduleExports.REST.prototype,
                        "delete",
                        this._getPatchedRequest("delete")
                    );
                    return moduleExports;
                },
                (moduleExports) => {
                    if (isWrapped(moduleExports.REST.prototype.get)) {
                        this._unwrap(moduleExports.REST.prototype, "get");
                    }
                    if (isWrapped(moduleExports.REST.prototype.post)) {
                        this._unwrap(moduleExports.REST.prototype, "post");
                    }
                    if (isWrapped(moduleExports.REST.prototype.put)) {
                        this._unwrap(moduleExports.REST.prototype, "put");
                    }
                    if (isWrapped(moduleExports.REST.prototype.patch)) {
                        this._unwrap(moduleExports.REST.prototype, "patch");
                    }
                    if (isWrapped(moduleExports.REST.prototype.delete)) {
                        this._unwrap(moduleExports.REST.prototype, "delete");
                    }
                }
            ),
        ];
    }

    private _getPatchedRequest(method: string) {
        return (original: typeof REST.prototype.get) => {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const instrumentation = this;
            return async function patchedGet(
                this: never,
                ...args: Parameters<typeof original>
            ) {
                const span = instrumentation.tracer.startSpan(
                    `discordjs.REST.${method}`,
                    {
                        attributes: {
                            "discordjs.REST.route": args[0],
                            kind: SpanKind.CLIENT,
                        },
                    }
                );

                let result;
                try {
                    result = await original.apply(this, args);
                } catch (e) {
                    span.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: (e as Error).message,
                    });
                } finally {
                    span.end();
                }

                return result;
            };
        };
    }
}
