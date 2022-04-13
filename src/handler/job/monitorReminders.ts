import { Client } from "discord.js";
import { ScheduledJob } from "../../decorators";
import { makeLogger } from "../../logger";
import {
    ReminderRepository
} from "../../repository/ReminderRepository";
import { processReminder } from "../../service/reminders";
import { isSome } from "../../util/guard";

const logger = makeLogger(module);

export class MonitorReminders {
    @ScheduledJob({ cron: "*/30 * * * * *" })
    async checkReminders(client: Client) {
        try {
            const reminders = await ReminderRepository.getReminders(new Date())
            
            if (reminders.length > 0) {
                const result = await Promise.all(reminders.map(async reminder => {
                    return await processReminder(reminder, client);
                }));
                const remindersToDelete = result.filter(isSome);

                ReminderRepository.delete(remindersToDelete)
            }
        } catch (e) {
            console.log("here")
            logger.error(e);
        }
    }
}