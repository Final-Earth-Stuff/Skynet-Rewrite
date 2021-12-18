import { SlashCommandBuilder } from "@discordjs/builders";
import {
    ButtonInteraction,
    CommandInteraction,
    MessageActionRow,
    MessageButton,
} from "discord.js";
import {
    NotificationSettingsRepository,
    Toggles,
} from "../../repository/NotficationSettingsRespository";
import { getCustomRepository } from "typeorm";
import { NotificationSettings } from "../../entity/NotificationSettings";

export const data = new SlashCommandBuilder()
    .setName("settings")
    .setDescription("View and toggle settings for notifications");

enum Color {
    PRIMARY = "PRIMARY",
    SECONDARY = "SECONDARY",
}

function getColorFromBoolean(bool: boolean) {
    if (bool) {
        return Color.PRIMARY;
    } else {
        return Color.SECONDARY;
    }
}

async function getStyle(discordId: string, setting: Toggles) {
    const settingsRepository = getCustomRepository(
        NotificationSettingsRepository
    );
    const values = await settingsRepository.getUserByDiscordId(discordId);
    if (values) {
        return getColorFromBoolean(values[setting]);
    }
    return Color.SECONDARY;
}

async function createRows(discordId: string) {
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.ENEMY)
                .setLabel("Enemy Movements")
                .setEmoji("☠️")
                .setStyle(await getStyle(discordId, Toggles.ENEMY))
        )
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.WAR)
                .setLabel("War Timer")
                .setEmoji("🔫")
                .setStyle(await getStyle(discordId, Toggles.WAR))
        )
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.QUEUE)
                .setLabel("Empty Queue")
                .setEmoji("🧠")
                .setStyle(await getStyle(discordId, Toggles.QUEUE))
        )
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.REIMB)
                .setLabel("Reimb Ready")
                .setEmoji("💰")
                .setStyle(await getStyle(discordId, Toggles.REIMB))
        );

    const row2 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.EVENT)
                .setLabel("New Event")
                .setEmoji("❗")
                .setStyle(await getStyle(discordId, Toggles.EVENT))
        )
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.MAIL)
                .setLabel("New Mail")
                .setEmoji("📧")
                .setStyle(await getStyle(discordId, Toggles.MAIL))
        )
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.PAUSED)
                .setLabel("Pause Notifications")
                .setEmoji("💤")
                .setStyle(await getStyle(discordId, Toggles.PAUSED))
        );

    return [row, row2];
}

function getCurrentSetting(setting: string, settings: NotificationSettings) {
    if (setting == Toggles.WAR) {
        return settings.war_flag;
    }
    if (setting == Toggles.QUEUE) {
        return settings.queue_flag;
    }
    if (setting == Toggles.REIMB) {
        return settings.reimb_flag;
    }
    if (setting == Toggles.ENEMY) {
        return settings.enemy_flag;
    }
    if (setting == Toggles.MAIL) {
        return settings.mail_flag;
    }
    if (setting == Toggles.EVENT) {
        return settings.event_flag;
    }
    if (setting == Toggles.PAUSED) {
        return settings.paused_flag;
    }
}

export const handler = async (interaction: CommandInteraction) => {
    const settingsRepository = getCustomRepository(
        NotificationSettingsRepository
    );
    const response = await settingsRepository.getUserByDiscordId(
        interaction.user.id
    );
    if (response && !response.valid_key) {
        interaction.reply({
            content:
                "Please save your API with the bot in order to use this feature",
        });
    } else {
        await interaction.reply({
            content: "Not implemented",
            components: await createRows(interaction.user.id),
        });
    }
};

export async function handleButton(interaction: ButtonInteraction) {
    const settingsRepository = getCustomRepository(
        NotificationSettingsRepository
    );
    const values = await settingsRepository.getUserByDiscordId(
        interaction.user.id
    );
    if (values) {
        const existingSetting = getCurrentSetting(interaction.customId, values);
        await settingsRepository.updateSetting(
            interaction.user.id,
            interaction.customId,
            !existingSetting
        );
    }
    interaction.update({
        content: "A component interaction was received",
        components: await createRows(interaction.user.id),
    });
}
