import { AppDataSource } from "../";
import { Reminder } from "../entity/Reminder";

export const ReminderRepository = AppDataSource.getRepository(
    Reminder
).extend({
    getReminders(now: Date): Promise<Reminder[]> {
        return this.manager
            .createQueryBuilder(Reminder, "reminder")
            .leftJoinAndSelect("reminder.user", "user")
            .where("reminder.timestamp < :now", {now})
            .getMany();
    },
})