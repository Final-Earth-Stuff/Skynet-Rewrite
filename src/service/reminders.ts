import { Client, DiscordAPIError, MessageEmbed } from "discord.js";
import { AppDataSource } from "../";
import { Reminder } from "../entity/Reminder";
import { makeLogger } from "../logger";
import {
    ReminderRepository
} from "../repository/ReminderRepository";

const logger = makeLogger(module);

export async function processReminder(reminder: Reminder, client: Client) {
    try {
        const discord = await client.users.fetch(reminder.user.discord_id)

        const embed = new MessageEmbed()
            .setTitle("This is a Reminder!")
            .setDescription(reminder.message ? reminder.message : "Ping!")

        await discord.send({embeds: [embed]});

        return parseInt(reminder.id);
        
    } catch (e) {
        if (e instanceof DiscordAPIError && e.code === 50007) {
            logger.error(`${e}: Removing reminder from database.`);
            ReminderRepository.delete(reminder.id)
        } else {
            logger.error(e);
        }
    }
}
