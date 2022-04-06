import { getCustomRepository } from "typeorm";
import {
    UserSettingsRepository,
    Timers,
    Counts,
} from "./repository/UserSettingsRepository";
import { Client, User } from "discord.js";
import { UserSettings } from "./entity/UserSettings";
import * as wrapper from "./wrapper/wrapper";
import {
    isNotifResponse,
    isUserResponse,
    isCountryResponse,
} from "./wrapper/utils";
import { makeLogger } from "./logger";
import { NotificationData } from "./wrapper/models/notification";

const logger = makeLogger(module);

export async function checkUsers(client: Client) {
    logger.info("checking all users...");
    const settingsRepository = getRepository();
    const values = await settingsRepository.getAllUserSettings();
    values?.forEach(async (user) => {
        if (user && user.api_key) {
            logger.info("checking " + user.user_id);
            const notifsData = await wrapper.getNotifications(user.api_key);
            if (isNotifResponse(notifsData?.data) && user.paused_flag != true) {
                const discord = await client.users
                    .fetch(user.discord_id)
                    .catch((error) => {
                        logger.error(error);
                    });

                if (discord) {
                    checkSettings(user, notifsData.data, discord);
                }
            }
        }
    });
}

async function checkSettings(
    user: UserSettings,
    notifsData: NotificationData,
    discord: User
) {
    const settingsRepository = getRepository();
    const timers: Timers = await buildTimers(user, notifsData, discord);
    const counts: Counts = await buildCounts(user, notifsData, discord);
    if (user?.enemy_flag == true && user.api_key) {
        const userData = await wrapper.getUser(user.api_key);
        let team = "None";
        if (isUserResponse(userData?.data)) {
            team = userData.data.team;
        }
        checkEnemies(user, discord, team);
    }

    await settingsRepository.updateTimers(timers);
    await settingsRepository.updateCounts(counts);
}

async function checkEnemies(user: UserSettings, discord: User, team: string) {
    const settingsRepository = getRepository();
    const apiKey = user.api_key ?? "";
    const data = await getCurrentCountry(team, apiKey);
    const prevNotif = user.prev_enemies_notification ?? new Date(0);
    const prevEnemies = user.prev_num_enemies ?? 0;
    if (
        (data?.currentCount || data?.currentCount === 0) &&
        data.currentCountry
    ) {
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
    user: UserSettings,
    notifsData: NotificationData,
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
    user: UserSettings,
    notifsData: NotificationData,
    discord: User
) {
    let war, queue, reimb;

    if (user.war_flag == true) {
        if (
            await checkTimer(
                notifsData.timers.war,
                user.prev_war_notification ?? new Date(0)
            )
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

function getRepository(): UserSettingsRepository {
    return getCustomRepository(UserSettingsRepository);
}
