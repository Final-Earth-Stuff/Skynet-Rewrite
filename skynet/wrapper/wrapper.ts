import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither.js";
import * as E from "fp-ts/lib/Either.js";

import func from "fp-ts/lib/function.js";

import fetch from "node-fetch";

import { IsNull, Not } from "typeorm";

import { UserData, PrivateUserData } from "./models/user.js";
import { NotificationData } from "./models/notification.js";
import { CountryData } from "./models/country.js";
import { FormationData } from "./models/formation.js";
import { UnitsData } from "./models/units.js";
import { AllUnitsData } from "./models/allunits.js";
import { feResponse } from "./models/common.js";
import { ApiError, NoKeyError } from "../error.js";
import { config } from "../config.js";
import { AppDataSource } from "../datasource.js";
import { UserSettings } from "../entity/UserSettings.js";

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

type InvalidKeyHandler = (wrapper: ApiWrapper) => Promise<void>;

export class ApiWrapper {
    private onInvalidKey?: InvalidKeyHandler;
    private key: string;

    private constructor(key: string, onInvalidKey?: InvalidKeyHandler) {
        this.key = key;
        this.onInvalidKey = onInvalidKey;
    }

    static get bot() {
        return new ApiWrapper(config.apiKey);
    }

    static forRaw(key: string) {
        return new ApiWrapper(key);
    }

    static async forUserId(user_id: number): Promise<ApiWrapper> {
        const user = await AppDataSource.getRepository(UserSettings).findOne({
            where: { user_id, valid_key: true, api_key: Not(IsNull()) },
            select: { api_key: true },
        });

        if (!user) {
            throw new NoKeyError("fe", user_id);
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return new ApiWrapper(user.api_key!, async (_wrapper) => {
            await AppDataSource.getRepository(UserSettings).update(
                { user_id },
                { api_key: null, valid_key: false }
            );
            throw new NoKeyError("fe", user_id);
        });
    }

    static async forDiscordId(discord_id: string): Promise<ApiWrapper> {
        const user = await AppDataSource.getRepository(UserSettings).findOne({
            where: { discord_id, valid_key: true, api_key: Not(IsNull()) },
            select: { api_key: true },
        });

        if (!user) {
            throw new NoKeyError("discord", discord_id);
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return new ApiWrapper(user.api_key!, async (_wrapper) => {
            await AppDataSource.getRepository(UserSettings).update(
                { discord_id },
                { api_key: null, valid_key: false }
            );
            throw new NoKeyError("discord", discord_id);
        });
    }

    static forUser(user: UserSettings): ApiWrapper {
        if (!user.api_key) {
            throw new NoKeyError("fe", user.user_id);
        }

        return new ApiWrapper(user.api_key, async (_wrapper) => {
            await AppDataSource.getRepository(UserSettings).update(
                { user_id: user.user_id },
                { api_key: null, valid_key: false }
            );
        });
    }

    private async apiRequest<C extends t.Mixed>(
        resource: string,
        codec: C,
        id?: number | string
    ): Promise<t.TypeOf<C>> {
        const params = [["key", this.key]];
        if (id) {
            params.push(["id", id.toString()]);
        }

        const query = params.map(([k, v]) => `${k}=${v}`).join("&");

        const url = `https://www.finalearth.com/api/${resource}?${query}`;

        const result = await func.flow(
            TE.tryCatchK(fetch, mapError),
            TE.chain((res) => TE.tryCatch(() => res.json(), mapError)),
            TE.chainEitherK(
                func.flow(
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
            if (result.left instanceof ApiError && result.left.code == 1) {
                await this.onInvalidKey?.(this);
            }

            throw result.left;
        } else {
            return result.right as Promise<t.TypeOf<C>>;
        }
    }

    getUser(): Promise<UserData & PrivateUserData>;
    getUser(id: number | string): Promise<UserData>;
    async getUser(id?: string | number) {
        return await this.apiRequest(
            "user",
            id ? UserData : t.intersection([UserData, PrivateUserData]),
            id
        );
    }

    async getNotifications(): Promise<NotificationData> {
        return await this.apiRequest("notifications", NotificationData);
    }

    async getCountry(id?: number): Promise<CountryData | null> {
        return await this.apiRequest(
            "country",
            t.union([CountryData, t.null]),
            id
        );
    }

    async getWorld(): Promise<CountryData[]> {
        return await this.apiRequest("world", t.array(CountryData));
    }

    async getFormation(): Promise<FormationData> {
        return await this.apiRequest("formation", FormationData);
    }

    async getUnits(): Promise<UnitsData[]> {
        return await this.apiRequest("units", t.array(UnitsData));
    }

    async getAllUnits(): Promise<AllUnitsData[]> {
        return await this.apiRequest("allunits", t.array(AllUnitsData));
    }
}

export default ApiWrapper;
