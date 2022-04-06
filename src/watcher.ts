import { getCustomRepository } from "typeorm";
import {
    NotificationSettingsRepository,
    Timers,
    Counts,
} from "./repository/NotificationSettingsRepository";
import { Client, User } from "discord.js";
import { NotificationSettings } from "./entity/NotificationSettings";
import * as wrapper from "./wrapper/wrapper";
import {CountryData}  from "./wrapper/models/country";
import {UserData}  from "./wrapper/models/user";
import {FEResponse, ErrorData} from "./wrapper/models/common";
import fetch from "node-fetch";

export async function checkUsers(client: Client) {
    console.log("checking users...");
    const settingsRepository = getCustomRepository(
        NotificationSettingsRepository
    );
    const values = await settingsRepository.getAllUserSettings();
    values?.forEach(async (user) => {
        console.log(user);
        if (user && user.api_key) {
            const notifsData = await wrapper.getNotifications(user.api_key);
            if (notifsData && !notifsData.error && user.paused_flag != true) {
                const userData = await wrapper.getUser(user.api_key);
                let team = "None";
                if (userData && !userData.error && isUserResponse(userData.data)) {
                    team = userData.data.team;
                }

                const discord = await client.users
                    .fetch(user.discord_id)
                    .catch((error) => {
                        console.log(error);
                    });
                if (discord) {
                    const timers: Timers = await buildTimers(
                        user,
                        notifsData.data,
                        discord
                    );
                    const counts: Counts = await buildCounts(
                        user,
                        notifsData.data,
                        discord
                        
                    );

                    checkEnemies(user, discord, team);
                    const settingsRepository = getCustomRepository(
                        NotificationSettingsRepository
                    );
                    console.log(timers);
                    console.log(counts);
                    await settingsRepository.updateTimers(timers);
                    await settingsRepository.updateCounts(counts);
                }
            }
        }
    });
}

function isUserResponse(response: UserData | ErrorData): response is UserData {
    return (response as UserData).id !== undefined;
}
function isCountryResponse(response: CountryData | ErrorData): response is CountryData {
    return (response as CountryData).id !== undefined;
}

async function checkEnemies(
    user: NotificationSettings,
    discord: User,
    team: string
) {
    if (user?.enemy_flag == true && user.api_key) {
        const data = await getCurrentCountry(team, user.api_key);
        const prevNotif = user.prev_enemies_notification ?? new Date(0);
        const prevEnemies = user.prev_num_enemies ?? 0;
        console.log(data)
        if (data?.currentCount && data.currentCountry) {
            console.log("helloooo")
            const settingsRepository = getCustomRepository(
                NotificationSettingsRepository
            );
            console.log(user.country)
            console.log(data.currentCountry)
            console.log(data.currentCount)
            if (user.country != data.currentCountry) {
                await settingsRepository.updateCountryAndEnemyCount(
                    user.discord_id,
                    data.currentCountry,
                    data.currentCount
                );
            } else if (
                user.country == data.currentCountry &&
                user.prev_num_enemies != data.currentCount &&
                Date.now() - prevNotif.getTime() > 300000
            ) {
                discord.send(
                    "☠️ Enemy troops have changed by " +
                        (data.currentCount - prevEnemies)
                );
                await settingsRepository.updateCountryAndEnemyCount(
                    user.discord_id,
                    data.currentCountry,
                    data.currentCount,
                    new Date()
                );
            }
        }
    }
}

async function getCurrentCountry(team: string, api_key: string) {
    const country = await wrapper.getCountry(api_key);
    if (isCountryResponse(country?.data) && country.data.units) {
        let currentCount: number | undefined;
        if (team == "Allies") {
            currentCount = country.data.units.axis;
        }
        if (team == "Axis") {
            currentCount = country.data.units.allies;
        }
        return {
            currentCountry: country.data.id,
            currentCount: currentCount,
        };
    }
}

async function buildCounts(
    user: NotificationSettings,
    notifsData: any,
    discord: User
) {
    let mail, events;
    const prevMail = user.prev_num_mails ?? 0;
    const prevEvents = user.prev_num_events ?? 0;
    if (user.mail_flag == true) {
        if (notifsData.unreadMails > prevMail) {
            await discord.send("📧 You have a new mail!");
            mail = notifsData.unreadMails;
        } else if (notifsData.unreadMails != prevMail) {
            mail = notifsData.unreadMails;
        }
    }
    if (user.event_flag == true) {
        if (notifsData.unreadEvents > prevEvents) {
            await discord.send("❗ You have a new event!");
            events = notifsData.unreadEvents;
        } else if (notifsData.unreadEvents != prevEvents) {
            events = notifsData.unreadEvents;
        }
    }
    const counts: Counts = {
        discord_id: user.discord_id,
        prev_num_events: events,
        prev_num_mails: mail,
    };
    return counts;
}

async function buildTimers(
    user: NotificationSettings,
    notifsData: any,
    discord: User
) {
    let war, queue, reimb;

    if (user.war_flag == true) {
        if (
            await checkTimer(notifsData.timers.war, user.prev_war_notification ?? new Date(0))
        ) {
            discord.send("🔫 Your War timer is up!");
            war = new Date(notifsData.timers.war * 1000);
        }
    }
    if (user.queue_flag == true) {
        if (
            await checkTimer(
                notifsData.timers.statistics,
                user.prev_queue_notification ?? new Date(0),
                notifsData.training.queued.length
            )
        ) {
            discord.send("🧠 Your Training Queue is empty!");
            queue = new Date(notifsData.timers.statistics * 1000);
        }
    }
    if (user.reimb_flag == true) {
        if (
            await checkTimer(
                notifsData.timers.reimbursement,
                user.prev_reimb_notification ?? new Date(0)
            )
        ) {
            discord.send("💰 Your reimbursement is ready!");
            reimb = new Date(notifsData.timers.reimbursement * 1000);
        }
    }
    const timers: Timers = {
        discord_id: user.discord_id,
        prev_war_notification: war,
        prev_queue_notification: queue,
        prev_reimb_notification: reimb,
    };
    return timers;
}

async function checkTimer(
    timer: number,
    lastTimerNotifiedFor: Date,
    queue?: number
) {
    if (
        lastTimerNotifiedFor?.getTime() != timer * 1000 &&
        timer * 1000 <= Date.now() &&
        (!queue || queue == 0)
    ) {
        return true;
    }
    return false;
}
