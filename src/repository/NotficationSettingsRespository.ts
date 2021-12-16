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

export enum Timers {
    WAR = "prev_war_notification",
    QUEUE = "prev_queue_notification",
    REIMB = "prev_reimb_notification",
}

export enum Counts {
    MAIL = "prev_num_mails",
    EVENT = "prev_num_events",
    ENEMY = "prev_num_enemies",
}

@EntityRepository(NotificationSettings)
export class NotificationSettingsRepository extends Repository<NotificationSettings> {
    updateSetting(discordId: string, toggle: Toggles, value: boolean) {
        return this.manager.update(NotificationSettings, discordId, {
            [toggle]: value,
        });
    }
    updateTimers(discordId: string, timer: Timers, value: Date) {
        return this.manager.update(NotificationSettings, discordId, {
            [timer]: value,
        });
    }
    updateCounts(discordId: string, count: Counts, value: number) {
        return this.manager.update(NotificationSettings, discordId, {
            [count]: value,
        });
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
