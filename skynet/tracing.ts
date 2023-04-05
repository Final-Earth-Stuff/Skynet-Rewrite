import { NodeSDK } from "@opentelemetry/sdk-node";
import {
    Context,
    context,
    diag,
    DiagConsoleLogger,
    DiagLogLevel,
    Span,
    SpanOptions,
    trace,
} from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

import manifest from "../package.json" assert { type: "json" };
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { DjsInstrumentation } from "./djsInstrumentation.js";

new AsyncLocalStorageContextManager().enable();

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

const exporter = new OTLPTraceExporter();
export const sdk = new NodeSDK({
    traceExporter: exporter,
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: "Skynet",
        [SemanticResourceAttributes.SERVICE_VERSION]: manifest.version,
    }),
    instrumentations: [new HttpInstrumentation(), new DjsInstrumentation()],
});

export function newSpan(name: string, options: SpanOptions, ctx: Context) {
    return trace.getTracer("skynet").startSpan(name, options, ctx);
}

type Unpromisify<T> = T extends Promise<infer I> ? I : T;

export async function withNewSpan<T extends (span: Span) => ReturnType<T>>(
    name: string,
    options: SpanOptions,
    body: T
): Promise<Unpromisify<ReturnType<T>>>;
export async function withNewSpan<T extends (span: Span) => ReturnType<T>>(
    name: string,
    options: SpanOptions,
    context: Context,
    body: T
): Promise<Unpromisify<ReturnType<T>>>;
export async function withNewSpan<T extends (span: Span) => ReturnType<T>>(
    name: string,
    options: SpanOptions,
    contextOrBody: Context | T,
    body?: T
): Promise<Unpromisify<ReturnType<T>>> {
    const actualBody = body ? body : (contextOrBody as T);
    const actualContext = body ? (contextOrBody as Context) : context.active();
    const span = newSpan(name, options, actualContext);
    let error = undefined;
    const result = context.with(trace.setSpan(context.active(), span), () =>
        Promise.resolve(actualBody(span))
            .catch((e) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                error = e;
            })
            .finally(() => {
                span.end();
            })
    );
    const value = await (result as Promise<Unpromisify<ReturnType<T>>>);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (error !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw error;
    }
    return value;
}
