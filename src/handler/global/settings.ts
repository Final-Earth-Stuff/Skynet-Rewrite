import { SlashCommandBuilder } from "@discordjs/builders";
import {
    ButtonInteraction,
    CommandInteraction,
    MessageActionRow,
    MessageButton,
} from "discord.js";
import { getCustomRepository } from "typeorm";

import { Command, CommandData, Button } from "../../decorators";
import {
    NotificationSettingsRepository,
    Toggles,
} from "../../repository/NotficationSettingsRespository";

export const data = new SlashCommandBuilder()
    .setName("settings")
    .setDescription("View and toggle settings for notifications");

enum Color {
    PRIMARY = "PRIMARY",
    SECONDARY = "SECONDARY",
}

function getColorFromBoolean(bool: boolean): Color {
    if (bool) {
        return Color.PRIMARY;
    } else {
        return Color.SECONDARY;
    }
}

async function getStyle(discordId: string, setting: Toggles): Promise<Color> {
    const settingsRepository = getCustomRepository(
        NotificationSettingsRepository
    );
    const values = await settingsRepository.getUserByDiscordId(discordId);
    return getColorFromBoolean(values?.[setting] ?? false);
}

async function createRows(discordId: string): Promise<MessageActionRow[]> {
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

async function updateSetting(interaction: ButtonInteraction) {
    const settingsRepository = getCustomRepository(
        NotificationSettingsRepository
    );
    const settings = await settingsRepository.getUserByDiscordId(
        interaction.user.id
    );
    if (settings) {
        const toggle = interaction.customId as Toggles;
        await settingsRepository.updateSetting(
            interaction.user.id,
            toggle,
            !settings[toggle]
        );
        interaction.update({
            content: "Settings updated!",
            components: await createRows(interaction.user.id),
        });
    } else {
        interaction.reply({ content: "Something went wrong!" });
    }
}

export class Settings {
    @CommandData({ type: "global" })
    settingsData() {
        return new SlashCommandBuilder()
            .setName("settings")
            .setDescription("View and toggle settings for notifications")
            .toJSON();
    }

    @Command({ name: "settings" })
    async settings(interaction: CommandInteraction): Promise<void> {
        const settingsRepository = getCustomRepository(
            NotificationSettingsRepository
        );
        const settings = await settingsRepository.getUserByDiscordId(
            interaction.user.id
        );
        if (settings) {
            if (!settings.valid_key) {
                interaction.reply({
                    content:
                        "Please save your API with the bot in order to use this feature",
                });
            } else {
                await interaction.reply({
                    content:
                        "Here are your current settings, click a button to enable/disable the setting.",
                    components: await createRows(interaction.user.id),
                });
            }
        } else {
            interaction.reply({ content: "Something went wrong!" });
        }
    }

    @Button({ customId: Toggles.WAR })
    async war(interaction: ButtonInteraction) {
        await updateSetting(interaction);
    }

    @Button({ customId: Toggles.ENEMY })
    async enemy(interaction: ButtonInteraction) {
        await updateSetting(interaction);
    }

    @Button({ customId: Toggles.EVENT })
    async event(interaction: ButtonInteraction) {
        await updateSetting(interaction);
    }

    @Button({ customId: Toggles.MAIL })
    async mail(interaction: ButtonInteraction) {
        await updateSetting(interaction);
    }

    @Button({ customId: Toggles.QUEUE })
    async queue(interaction: ButtonInteraction) {
        await updateSetting(interaction);
    }

    @Button({ customId: Toggles.REIMB })
    async reimb(interaction: ButtonInteraction) {
        await updateSetting(interaction);
    }

    @Button({ customId: Toggles.PAUSED })
    async paused(interaction: ButtonInteraction) {
        await updateSetting(interaction);
    }
}
