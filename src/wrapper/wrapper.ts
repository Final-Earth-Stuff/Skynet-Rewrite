import { UserData } from "./models/user";
import { NotificationData } from "./models/notification";
import { CountryData } from "./models/country";
import { FEResponse, isErrorResponse } from "./models/common";
import fetch, { Response } from "node-fetch";
import { ApiError } from "../error";

function url(resource: string, key: string, id?: string | number) {
    const params = [["key", key]];
    if (id) {
        params.push(["id", id.toString()]);
    }

    const query = params.map(([k, v]) => `${k}=${v}`).join("&");

    return `https://www.finalearth.com/api/${resource}?${query}`;
}

export async function getUser(
    key: string,
    id?: string | number
): Promise<UserData> {
    const response = await fetch(url("user", key, id));
    return handleErrors(response);
}

export async function getNotifications(key: string): Promise<NotificationData> {
    const response = await fetch(url("notifications", key));
    return handleErrors(response);
}

export async function getCountry(
    key: string,
    id?: number
): Promise<CountryData> {
    const response = await fetch(url("country", key, id));
    return handleErrors(response);
}

export async function getWorld(key: string): Promise<CountryData[]> {
    const response = await fetch(url("world", key));
    return handleErrors(response);
}

async function handleErrors<T>(response: Response): Promise<T> {
    if (!response.ok) {
        throw new ApiError(response.statusText);
    }
    const json: FEResponse<T> = await response.json();
    if (isErrorResponse(json)) {
        throw new ApiError(json.reason, json.data.code);
    }
    return json.data;
}
