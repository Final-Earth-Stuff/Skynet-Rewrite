import { UserData } from "./models/user";
import { NotificationData } from "./models/notification";
import { CountryData } from "./models/country";
import { ErrorData } from "./models/common";

type ApiData = ErrorData | UserData | CountryData | NotificationData;

export function isErrorResponse(response: ApiData): response is ErrorData {
    return (response as ErrorData).code !== undefined;
}

export function isUserResponse(
    response: UserData | ErrorData
): response is UserData {
    return (response as UserData).id !== undefined;
}

export function isCountryResponse(
    response: CountryData | ErrorData
): response is CountryData {
    return (response as CountryData).id !== undefined;
}

export function isNotifResponse(
    response: NotificationData | ErrorData
): response is NotificationData {
    return (response as NotificationData).unreadEvents !== undefined;
}
