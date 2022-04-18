import { SlashCommandBuilder } from "@discordjs/builders";
import {
    ButtonInteraction,
    CommandInteraction,
    MessageActionRow,
    MessageButton,
} from "discord.js";
import { UserSettings } from "src/entity/UserSettings";
import { BotError } from "../../error";

import { Command, CommandData, Button, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";
import {
    UserSettingsRepository,
    Toggles,
} from "../../repository/UserSettingsRepository";

import { ButtonColor } from "../../service/util/constants";

export class Settings {
    @CommandData({ type: "global" })
    settingsData() {
        return new SlashCommandBuilder()
            .setName("settings")
            .setDescription("View and toggle settings for notifications")
            .toJSON();
    }

    @Command({ name: "settings" })
    @Guard({ body: commandChannelGuard })
    async settings(interaction: CommandInteraction): Promise<void> {
        const settings = await UserSettingsRepository.getUserByDiscordId(
            interaction.user.id
        );
        const user = await UserSettingsRepository.getUserByDiscordId(
            interaction.user.id
        );

        if (!user || !settings?.valid_key) {
            throw new BotError(
                "Please use the /start command to store  your API key in order to use this feature."
            );
        }

        await interaction.reply({
            content:
                "Here are your current settings, click a button to enable/disable the setting.",
            components: createRows(user),
        });
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

async function updateSetting(interaction: ButtonInteraction): Promise<void> {
    const settings = await UserSettingsRepository.getUserByDiscordId(
        interaction.user.id
    );
    if (settings) {
        const toggle = interaction.customId as Toggles;
        settings[toggle] = !settings[toggle];

        await UserSettingsRepository.updateSetting(
            interaction.user.id,
            toggle,
            settings[toggle]
        );
        interaction.update({
            content: `"Settings updated!"`,
            components: createRows(settings),
        });
    } else {
        throw new BotError("Something went wrong!");
    }
}

function createRows(user: UserSettings): MessageActionRow[] {
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.ENEMY)
                .setLabel("Enemy Movements")
                .setEmoji("☠️")
                .setStyle(getButtonColor(user.enemy_flag))
                .setDisabled(user.paused_flag)
        )
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.WAR)
                .setLabel("War Timer")
                .setEmoji("🔫")
                .setStyle(getButtonColor(user.war_flag))
                .setDisabled(user.paused_flag)
        )
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.QUEUE)
                .setLabel("Empty Queue")
                .setEmoji("🧠")
                .setStyle(getButtonColor(user.queue_flag))
                .setDisabled(user.paused_flag)
        )
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.REIMB)
                .setLabel("Reimb Ready")
                .setEmoji("💰")
                .setStyle(getButtonColor(user.reimb_flag))
                .setDisabled(user.paused_flag)
        );

    const row2 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.EVENT)
                .setLabel("New Event")
                .setEmoji("❗")
                .setStyle(getButtonColor(user.event_flag))
                .setDisabled(user.paused_flag)
        )
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.MAIL)
                .setLabel("New Mail")
                .setEmoji("📧")
                .setStyle(getButtonColor(user.mail_flag))
                .setDisabled(user.paused_flag)
        )
        .addComponents(
            new MessageButton()
                .setCustomId(Toggles.PAUSED)
                .setLabel("Pause Notifications")
                .setEmoji("💤")
                .setStyle(getButtonColor(user.paused_flag))
        );

    return [row, row2];
}

function getButtonColor(flag: boolean): ButtonColor {
    return flag ? ButtonColor.ENABLED : ButtonColor.DISABLED;
}
