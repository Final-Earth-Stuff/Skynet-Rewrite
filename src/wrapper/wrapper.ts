import { UserData } from "./models/user";
import { NotificationData } from "./models/notification";
import { CountryData } from "./models/country";
import { FEResponse } from "./models/common";
import fetch, { Response } from "node-fetch";
import { ApiError } from "../error";

export async function getUser(apiKey: string): Promise<UserData> {
    const response = await fetch(
        "https://www.finalearth.com/api/user?key=" + apiKey
    );
    return handleErrors<UserData>(response);
}

export async function getNotifications(
    apiKey: string
): Promise<NotificationData> {
    const response = await fetch(
        "https://www.finalearth.com/api/notifications?key=" + apiKey
    );
    return handleErrors<NotificationData>(response);
}

export async function getCountry(apiKey: string): Promise<CountryData> {
    const response = await fetch(
        "https://www.finalearth.com/api/country?key=" + apiKey
    );
    return handleErrors<CountryData>(response);
}

async function handleErrors<T>(response: Response): Promise<T> {
    if (!response.ok) {
        throw new ApiError(response.statusText);
    }
    const json: FEResponse<T> = await response.json();
    if (json?.error && typeof json.reason === "string") {
        throw new ApiError(json.reason);
    }
    return json.data;
}
