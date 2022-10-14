import { Client, User } from "discord.js";

import { ScheduledJob, Cron } from "../../decorators";

import {
    UserSettingsRepository,
    Timers,
    Counts,
} from "../../repository/UserSettingsRepository";
import { UserSettings } from "../../entity/UserSettings";
import { ApiWrapper } from "../../wrapper/wrapper";
import { makeLogger } from "../../logger";
import { NotificationData } from "../../wrapper/models/notification";
import { Team } from "../../service/util/constants";
import { ApiError } from "../../error";

const logger = makeLogger(import.meta);

@ScheduledJob()
export class MonitorUsers {
    @Cron({ cron: "*/30 * * * * *", label: "monitor_users" })
    async checkUsers(client: Client) {
        logger.debug("checking all users...");
        const values = await UserSettingsRepository.getAllUserSettings();
        await Promise.all(
            values.map(async (user) => {
                if (user.api_key) {
                    logger.debug("checking %s", user.user_id);
                    try {
                        const notifsData = await ApiWrapper.forUser(
                            user
                        ).getNotifications();
                        if (!user.paused_flag) {
                            const discord = await client.users
                                .fetch(user.discord_id)
                                .catch((error) => {
                                    logger.error(error);
                                });

                            if (discord) {
                                await this.checkSettings(
                                    user,
                                    notifsData,
                                    discord
                                );
                            }
                        }
                    } catch (e) {
                        if (e instanceof ApiError && e.code === 4) {
                            // ignore user not in round errors
                        } else {
                            throw e;
                        }
                    }
                }
            })
        );
    }

    async checkSettings(
        user: UserSettings,
        notifsData: NotificationData,
        discord: User
    ) {
        const timers: Timers = {};
        const counts: Counts = {};
        try {
            await this.buildTimers(user, notifsData, timers, discord);
            await this.buildCounts(user, notifsData, counts, discord);
            if (user.enemy_flag && user.api_key) {
                const userData = await ApiWrapper.forUser(user).getUser();
                let team = Team.NONE;
                team = userData.team;

                await this.checkEnemies(user, discord, team);
            }
        } finally {
            await UserSettingsRepository.updateTimersAndCounts(
                discord.id,
                timers,
                counts
            );
        }
    }

    async checkEnemies(user: UserSettings, discord: User, team: string) {
        const data = await this.getCurrentCountry(team, user);
        if (!data) return;

        const prevNotif = user.prev_enemies_notification ?? new Date(0);
        const prevEnemies = user.prev_num_enemies ?? 0;
        if (
            (data.currentCount || data.currentCount === 0) &&
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
                await discord.send(
                    `☠️ Enemy troops have changed by ${
                        data.currentCount - prevEnemies
                    }`
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

    async getCurrentCountry(team: string, user: UserSettings) {
        const country = await ApiWrapper.forUser(user).getCountry();
        if (!country) return;

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

    async buildCounts(
        user: UserSettings,
        notifsData: NotificationData,
        counts: Counts,
        discord: User
    ) {
        const prevMail = user.prev_num_mails ?? 0;
        const prevEvents = user.prev_num_events ?? 0;
        if (user.mail_flag) {
            if (notifsData.unreadMails > prevMail) {
                await discord.send("📧 You have a new mail!");
                counts.prev_num_mails = notifsData.unreadMails;
            } else if (notifsData.unreadMails != prevMail) {
                counts.prev_num_mails = notifsData.unreadMails;
            }
        }
        if (user.event_flag) {
            if (notifsData.unreadEvents > prevEvents) {
                await discord.send("❗ You have a new event!");
                counts.prev_num_events = notifsData.unreadEvents;
            } else if (notifsData.unreadEvents != prevEvents) {
                counts.prev_num_events = notifsData.unreadEvents;
            }
        }
    }

    async buildTimers(
        user: UserSettings,
        notifsData: NotificationData,
        timers: Timers,
        discord: User
    ) {
        if (user.war_flag) {
            if (
                this.checkTimer(
                    notifsData.timers.war,
                    user.prev_war_notification ?? new Date(0)
                )
            ) {
                await discord.send("🔫 Your War timer is up!");
                timers.prev_war_notification = new Date(
                    notifsData.timers.war * 1000
                );
            }
        }
        if (user.queue_flag) {
            if (
                this.checkTimer(
                    notifsData.timers.statistics,
                    user.prev_queue_notification ?? new Date(0),
                    notifsData.training.queued.length
                )
            ) {
                await discord.send("🧠 Your Training Queue is empty!");
                timers.prev_queue_notification = new Date(
                    notifsData.timers.statistics * 1000
                );
            }
        }
        if (user.reimb_flag) {
            if (
                this.checkTimer(
                    notifsData.timers.reimbursement,
                    user.prev_reimb_notification ?? new Date(0)
                )
            ) {
                await discord.send("💰 Your reimbursement is ready!");
                timers.prev_reimb_notification = new Date(
                    notifsData.timers.reimbursement * 1000
                );
            }
        }
    }

    checkTimer(timer: number, lastTimerNotifiedFor: Date, queue?: number) {
        if (
            lastTimerNotifiedFor.getTime() !== timer * 1000 &&
            timer * 1000 <= Date.now() &&
            (!queue || queue === 0)
        ) {
            return true;
        }
        return false;
    }
}
