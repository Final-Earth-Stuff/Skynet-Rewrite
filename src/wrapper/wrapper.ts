import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

import { flow } from "fp-ts/function";

import fetch from "node-fetch";

import { UserData, PrivateUserData } from "./models/user";
import { NotificationData } from "./models/notification";
import { CountryData } from "./models/country";
import { FormationData } from "./models/formation";
import { UnitsData } from "./models/units";
import { AllUnitsData } from "./models/allunits";
import { feResponse } from "./models/common";
import { ApiError } from "../error";

function url(resource: string, key: string, id?: string | number) {
    const params = [["key", key]];
    if (id) {
        params.push(["id", id.toString()]);
    }

    const query = params.map(([k, v]) => `${k}=${v}`).join("&");

    return `https://www.finalearth.com/api/${resource}?${query}`;
}

export function getUser(key: string): Promise<UserData & PrivateUserData>;
export function getUser(key: string, id: number | string): Promise<UserData>;
export async function getUser(key: string, id?: string | number) {
    return await apiRequest(
        url("user", key, id),
        id ? UserData : t.intersection([UserData, PrivateUserData])
    );
}

export async function getNotifications(key: string): Promise<NotificationData> {
    return await apiRequest(url("notifications", key), NotificationData);
}

export async function getCountry(
    key: string,
    id?: number
): Promise<CountryData | null> {
    return await apiRequest(
        url("country", key, id),
        t.union([CountryData, t.null])
    );
}

export async function getWorld(key: string): Promise<CountryData[]> {
    return await apiRequest(url("world", key), t.array(CountryData));
}

export async function getFormation(key: string): Promise<FormationData> {
    return await apiRequest(url("formation", key), FormationData);
}

export async function getUnits(key: string): Promise<UnitsData[]> {
    return await apiRequest(url("units", key), t.array(UnitsData));
}
export async function getAllUnits(key: string): Promise<AllUnitsData[]> {
    return await apiRequest(url("allunits", key), t.array(AllUnitsData));
}

const mapError = (e: unknown): Error =>
    e instanceof Error ? e : new Error("This should never happen");

const formatErrors = (errors: t.Errors) =>
    new Error(
        "Errors occured while validating API resonse:\n  " +
            errors
                .map((error) => {
                    const path = error.context
                        .slice(1)
                        .map(({ key }) => key)
                        .join(".");
                    const expected =
                        error.context[error.context.length - 1].type.name;
                    return `Expected \`${expected}\`, found invalid value ${JSON.stringify(
                        error.value
                    )} @ ${path}}`;
                })
                .join("\n  ")
    );

async function apiRequest<C extends t.Mixed>(
    url: string,
    codec: C
): Promise<t.TypeOf<C>> {
    const result = await flow(
        TE.tryCatchK((url: string) => fetch(url), mapError),
        TE.filterOrElse(
            (resp) => resp.ok,
            (resp) => new ApiError(resp.statusText)
        ),
        TE.chain((res) => TE.tryCatch(() => res.json(), mapError)),
        TE.chainEitherK(
            flow(
                /* eslint-disable-next-line @typescript-eslint/unbound-method */
                feResponse(codec).decode,
                E.mapLeft(formatErrors),
                E.chain((res) =>
                    res.error
                        ? E.left(new ApiError(res.reason, res.data.code))
                        : E.right(res.data)
                )
            )
        )
    )(url)();

    if (E.isLeft(result)) {
        throw result.left;
    } else {
        return result.right as Promise<t.TypeOf<C>>;
    }
}
