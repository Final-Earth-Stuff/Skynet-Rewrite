import { UserData } from "./models/user";
import { NotificationData } from "./models/notification";
import { CountryData } from "./models/country";
import { ErrorData, FEResponse } from "./models/common";
import fetch from "node-fetch";

export async function getUser(
    apiKey: string
): Promise<FEResponse<UserData | ErrorData>> {
    return await fetch("https://www.finalearth.com/api/user?key=" + apiKey)
        .then((response) => response.json())
        .catch((error) => {
            console.log(error);
        });
}

export async function getNotifications(
    apiKey: string
): Promise<FEResponse<NotificationData | ErrorData>> {
    return await fetch(
        "https://www.finalearth.com/api/notifications?key=" + apiKey
    )
        .then((response) => response.json())
        .catch((error) => {
            console.log(error);
        });
}

export async function getCountry(
    apiKey: string
): Promise<FEResponse<CountryData | ErrorData>> {
    return await fetch("https://www.finalearth.com/api/country?key=" + apiKey)
        .then((response) => response.json())
        .catch((error) => {
            console.log(error);
        });
}
