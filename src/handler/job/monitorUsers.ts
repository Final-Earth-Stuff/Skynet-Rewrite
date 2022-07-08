import { Client, User } from "discord.js";

import { ScheduledJob, Cron } from "../../decorators";

import {
    UserSettingsRepository,
    Timers,
    Counts,
} from "../../repository/UserSettingsRepository";
import { UserSettings } from "../../entity/UserSettings";
import * as wrapper from "../../wrapper/wrapper";
import { makeLogger } from "../../logger";
import { NotificationData } from "../../wrapper/models/notification";
import { Team } from "../../service/util/constants";

const logger = makeLogger(module);

@ScheduledJob()
export class MonitorUsers {
    @Cron("*/30 * * * * *")
    async checkUsers(client: Client) {
        logger.debug("checking all users...");
        try {
            const values = await UserSettingsRepository.getAllUserSettings();
            values?.forEach(async (user) => {
                if (user && user.api_key) {
                    logger.debug("checking " + user.user_id);
                    const notifsData = await wrapper.getNotifications(
                        user.api_key
                    );
                    if (!user.paused_flag) {
                        const discord = await client.users
                            .fetch(user.discord_id)
                            .catch((error) => {
                                logger.error(error);
                            });

                        if (discord) {
                            this.checkSettings(user, notifsData, discord);
                        }
                    }
                }
            });
        } catch (e) {
            logger.error(e);
        }
    }

    async checkSettings(
        user: UserSettings,
        notifsData: NotificationData,
        discord: User
    ) {
        const timers: Timers = await this.buildTimers(
            user,
            notifsData,
            discord
        );
        const counts: Counts = await this.buildCounts(
            user,
            notifsData,
            discord
        );
        if (user?.enemy_flag && user.api_key) {
            const userData = await wrapper.getUser(user.api_key);
            let team = Team.NONE;
            team = userData.team;

            this.checkEnemies(user, discord, team);
        }

        await UserSettingsRepository.updateTimers(timers);
        await UserSettingsRepository.updateCounts(counts);
    }

    async checkEnemies(user: UserSettings, discord: User, team: string) {
        const apiKey = user.api_key ?? "";
        const data = await this.getCurrentCountry(team, apiKey);
        const prevNotif = user.prev_enemies_notification ?? new Date(0);
        const prevEnemies = user.prev_num_enemies ?? 0;
        if (
            (data?.currentCount || data?.currentCount === 0) &&
            data.currentCountry
        ) {
            if (user.country != data.currentCountry) {
                await UserSettingsRepository.updateCountryAndEnemyCount(
                    user.discord_id,
                    data.currentCountry,
                    data.currentCount
                );
            } else if (
                user.prev_num_enemies !== data.currentCount &&
                Date.now() - prevNotif.getTime() > 300000
            ) {
                discord.send(
                    "☠️ Enemy troops have changed by " +
                        (data.currentCount - prevEnemies)
                );
                await UserSettingsRepository.updateCountryAndEnemyCount(
                    user.discord_id,
                    data.currentCountry,
                    data.currentCount,
                    new Date()
                );
            }
        }
    }

    async getCurrentCountry(team: string, api_key: string) {
        const country = await wrapper.getCountry(api_key);
        if (country.units) {
            let currentCount: number | undefined;
            if (team === Team.ALLIES) {
                currentCount = country.units.axis;
            }
            if (team === Team.AXIS) {
                currentCount = country.units.allies;
            }
            return {
                currentCountry: parseInt(country.id),
                currentCount: currentCount,
            };
        }
    }

    async buildCounts(
        user: UserSettings,
        notifsData: NotificationData,
        discord: User
    ) {
        let mail, events;
        const prevMail = user.prev_num_mails ?? 0;
        const prevEvents = user.prev_num_events ?? 0;
        if (user.mail_flag) {
            if (notifsData.unreadMails > prevMail) {
                await discord.send("📧 You have a new mail!");
                mail = notifsData.unreadMails;
            } else if (notifsData.unreadMails != prevMail) {
                mail = notifsData.unreadMails;
            }
        }
        if (user.event_flag) {
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

    async buildTimers(
        user: UserSettings,
        notifsData: NotificationData,
        discord: User
    ) {
        let war, queue, reimb;

        if (user.war_flag) {
            if (
                await this.checkTimer(
                    notifsData.timers.war,
                    user.prev_war_notification ?? new Date(0)
                )
            ) {
                discord.send("🔫 Your War timer is up!");
                war = new Date(notifsData.timers.war * 1000);
            }
        }
        if (user.queue_flag) {
            if (
                await this.checkTimer(
                    notifsData.timers.statistics,
                    user.prev_queue_notification ?? new Date(0),
                    notifsData.training.queued.length
                )
            ) {
                discord.send("🧠 Your Training Queue is empty!");
                queue = new Date(notifsData.timers.statistics * 1000);
            }
        }
        if (user.reimb_flag) {
            if (
                await this.checkTimer(
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

    async checkTimer(
        timer: number,
        lastTimerNotifiedFor: Date,
        queue?: number
    ) {
        if (
            lastTimerNotifiedFor?.getTime() !== timer * 1000 &&
            timer * 1000 <= Date.now() &&
            (!queue || queue === 0)
        ) {
            return true;
        }
        return false;
    }
}
