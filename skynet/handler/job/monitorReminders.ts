import { Client } from "discord.js";
import { ScheduledJob, Cron } from "../../decorators/index.js";
import { makeLogger } from "../../logger.js";
import { ReminderRepository } from "../../repository/ReminderRepository.js";
import { processReminder } from "../../service/reminders.js";
import { isSome } from "../../util/guard.js";

const logger = makeLogger(import.meta);

@ScheduledJob()
export class MonitorReminders {
    @Cron({ cron: "*/30 * * * * *", label: "monitor_reminders" })
    async checkReminders(client: Client) {
        try {
            const reminders = await ReminderRepository.getReminders(new Date());

            if (reminders.length > 0) {
                const result = await Promise.all(
                    reminders.map(async (reminder) => {
                        return await processReminder(reminder, client);
                    })
                );
                const remindersToDelete = result.filter(isSome);

                await ReminderRepository.delete(remindersToDelete);
            }
        } catch (e) {
            logger.error(e);
        }
    }
}
