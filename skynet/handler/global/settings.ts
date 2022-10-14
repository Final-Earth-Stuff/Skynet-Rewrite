import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} from "discord.js";
import { UserSettings } from "skynet/entity/UserSettings";
import { BotError } from "../../error";

import {
    Command,
    CommandData,
    CommandHandler,
    Button,
    ButtonHandler,
} from "../../decorators";
import {
    UserSettingsRepository,
    Toggles,
} from "../../repository/UserSettingsRepository";

@CommandHandler({ name: "settings" })
@ButtonHandler()
export class Settings {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("settings")
        .setDescription("View and toggle settings for notifications")
        .setDefaultMemberPermissions(0)
        .toJSON();

    @Command()
    async settings(interaction: ChatInputCommandInteraction): Promise<void> {
        const settings = await UserSettingsRepository.getUserByDiscordId(
            interaction.user.id
        );
        const user = await UserSettingsRepository.getUserByDiscordId(
            interaction.user.id
        );

        if (!user || !settings?.valid_key) {
            throw new BotError(
                "Please DM the bot the /start command to store  your API key in order to use this feature."
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
        await interaction.update({
            content: `"Settings updated!"`,
            components: createRows(settings),
        });
    } else {
        throw new BotError("Something went wrong!");
    }
}

function createRows(user: UserSettings): ActionRowBuilder<ButtonBuilder>[] {
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(Toggles.ENEMY)
                .setLabel("Enemy Movements")
                .setEmoji("☠️")
                .setStyle(getButtonColor(user.enemy_flag))
                .setDisabled(user.paused_flag)
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId(Toggles.WAR)
                .setLabel("War Timer")
                .setEmoji("🔫")
                .setStyle(getButtonColor(user.war_flag))
                .setDisabled(user.paused_flag)
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId(Toggles.QUEUE)
                .setLabel("Empty Queue")
                .setEmoji("🧠")
                .setStyle(getButtonColor(user.queue_flag))
                .setDisabled(user.paused_flag)
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId(Toggles.REIMB)
                .setLabel("Reimb Ready")
                .setEmoji("💰")
                .setStyle(getButtonColor(user.reimb_flag))
                .setDisabled(user.paused_flag)
        );

    const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(Toggles.EVENT)
                .setLabel("New Event")
                .setEmoji("❗")
                .setStyle(getButtonColor(user.event_flag))
                .setDisabled(user.paused_flag)
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId(Toggles.MAIL)
                .setLabel("New Mail")
                .setEmoji("📧")
                .setStyle(getButtonColor(user.mail_flag))
                .setDisabled(user.paused_flag)
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId(Toggles.PAUSED)
                .setLabel("Pause Notifications")
                .setEmoji("💤")
                .setStyle(getButtonColor(user.paused_flag))
        );

    return [row, row2];
}

function getButtonColor(flag: boolean): ButtonStyle {
    return flag ? ButtonStyle.Primary : ButtonStyle.Secondary;
}
