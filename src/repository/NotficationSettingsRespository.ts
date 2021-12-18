import { EntityRepository, Repository } from "typeorm";
import { NotificationSettings, Team } from "../entity/NotificationSettings";

export enum Toggles {
    WAR = "war_flag",
    QUEUE = "queue_flag",
    MAIL = "mail_flag",
    EVENT = "event_flag",
    ENEMY = "enemy_flag",
    REIMB = "reimb_flag",
    PAUSED = "paused_flag",
}

export interface Timers {
    prev_war_notification: Date;
    prev_queue_notification: Date;
    prev_reimb_notification: Date;
}

export interface Counts {
    prev_num_mails: number;
    prev_num_events: number;
    prev_num_enemies: number;
}

@EntityRepository(NotificationSettings)
export class NotificationSettingsRepository extends Repository<NotificationSettings> {
    updateSetting(discordId: string, toggle: string, value: boolean) {
        return this.manager.update(NotificationSettings, discordId, {
            [toggle]: value,
        });
    }
    updateTimers(discordId: string, timers: Partial<Timers>) {
        return this.manager.update(NotificationSettings, discordId, timers);
    }
    updateCounts(discordId: string, counts: Partial<Counts>) {
        return this.manager.update(NotificationSettings, discordId, counts);
    }
    getUserByDiscordId(discordId: string) {
        return this.manager.findOne(NotificationSettings, discordId);
    }
    updateCountryAndEnemyCount(
        discordId: string,
        country: number,
        enemy_count: number,
        notif_time?: Date
    ) {
        return this.manager.update(NotificationSettings, discordId, {
            prev_num_enemies: enemy_count,
            country: country,
            prev_enemies_notification: notif_time,
        });
    }
    getAllUserSettings() {
        return this.manager.find(NotificationSettings);
    }
    saveSettings(
        discordId: string,
        apiKey: string,
        validKey: boolean,
        userId?: number,
        team?: Team
    ) {
        const notificationSettings = new NotificationSettings();
        notificationSettings.discord_id = discordId;
        notificationSettings.api_key = apiKey;
        notificationSettings.valid_key = validKey;
        notificationSettings.user_id = userId;
        notificationSettings.team = team;
        return this.manager.save(notificationSettings);
    }
    deleteByDiscordId(discordId: string) {
        return this.manager.delete(NotificationSettings, discordId);
    }
}
