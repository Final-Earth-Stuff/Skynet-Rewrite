import {
    ChatInputCommandInteraction,
    Guild,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";

import {
    CommandHandler,
    SubCommand,
    CommandData,
    EventHandler,
    DiscordEvent,
} from "../../decorators";

import { AppDataSource } from "../..";
import { CommandRepository } from "../../repository/CommandRepository";
import { Guild as GuildEntity } from "../../entity/Guild";
import { Color } from "../../service/util/constants";

import { handlers } from "../../bot";

@CommandHandler({ name: "role" })
@EventHandler()
export class Role {
    @CommandData({ type: "guild" })
    readonly data = new SlashCommandBuilder()
        .setName("role")
        .setDescription("Configure roles")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Add new role")
                .addStringOption((option) =>
                    option
                        .setName("type")
                        .setDescription("Which type of role to configure")
                        .setRequired(true)
                        .addChoices(
                            { name: "Allies", value: "allies" },
                            { name: "Axis", value: "axis" },
                            { name: "Spectator", value: "spectator" },
                            { name: "Verified", value: "verified" },
                            { name: "Auto", value: "auto" }
                        )
                )
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setDescription("Which role to use")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Unset a configured role")
                .addStringOption((option) =>
                    option
                        .setName("type")
                        .setDescription("Which type of role to configure")
                        .setRequired(true)
                        .addChoices(
                            { name: "Allies", value: "allies" },
                            { name: "Axis", value: "axis" },
                            { name: "Spectator", value: "spectator" },
                            { name: "Verified", value: "verified" },
                            { name: "Auto", value: "auto" }
                        )
                )
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setDescription("Which role to remove")
                )
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("info").setDescription("List configured roles")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("toggle-teams")
                .setDescription("Toggle setting team roles")
        )
        .toJSON();

    @SubCommand({ name: "add" })
    async roleAdd(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        const role = interaction.options.getRole("role", true);
        const type = interaction.options.getString("type", true);

        const guildRepository = AppDataSource.getRepository(GuildEntity);

        await guildRepository.update(interaction.guildId ?? "", {
            [`${type}_role`]: role.id,
        });

        const success = new EmbedBuilder()
            .setDescription(`Successfully set ${type} role to <@&${role.id}>!`)
            .setColor(Color.GREEN);

        await interaction.editReply({ embeds: [success] });
    }

    @SubCommand({ name: "remove" })
    async roleRemove(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        const type = interaction.options.getString("type", true);

        const guildRepository = AppDataSource.getRepository(GuildEntity);

        await guildRepository.update(interaction.guildId ?? "", {
            [`${type}_role`]: null,
        });

        const success = new EmbedBuilder()
            .setDescription(`Successfully unset ${type} role!`)
            .setColor(Color.GREEN);

        await interaction.editReply({ embeds: [success] });
    }

    @SubCommand({ name: "info" })
    async roleInfo(interaction: ChatInputCommandInteraction): Promise<void> {
        const guildRepository = AppDataSource.getRepository(GuildEntity);
        const guild = await guildRepository.findOneOrFail({
            where: { guild_id: interaction.guildId ?? "" },
        });

        const embed = new EmbedBuilder()
            .setTitle("Roles")
            .addFields(
                {
                    name: "Allies",
                    value: guild.allies_role
                        ? `<@&${guild.allies_role}>`
                        : "Not configured",
                    inline: true,
                },
                {
                    name: "Axis",
                    value: guild.axis_role
                        ? `<@&${guild.axis_role}>`
                        : "Not configured",
                    inline: true,
                },
                {
                    name: "Spectator",
                    value: guild.spectator_role
                        ? `<@&${guild.spectator_role}>`
                        : "Not configured",
                    inline: true,
                },
                {
                    name: "Auto",
                    value: guild.auto_role
                        ? `<@&${guild.auto_role}>`
                        : "Not configured",
                    inline: true,
                }
            )
            .setColor(Color.BLUE);

        await interaction.reply({ embeds: [embed] });
    }

    @SubCommand({ name: "toggle-teams" })
    async teamRoleToggle(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const guildRepository = AppDataSource.getRepository(GuildEntity);
        const guild = await guildRepository.findOneOrFail({
            where: { guild_id: interaction.guildId ?? "" },
        });

        await guildRepository.update(guild.guild_id, {
            roles_enabled: !guild.roles_enabled,
        });

        const state = guild.roles_enabled ? "disabled" : "enabled";

        const embed = new EmbedBuilder()
            .setDescription(`Team role setting is now ${state} for this guild!`)
            .setColor(Color.BLUE);

        await interaction.reply({ embeds: [embed] });
    }

    @DiscordEvent("guildCreate")
    async setPermission(guild: Guild) {
        const guildEntity = new GuildEntity();
        guildEntity.guild_id = guild.id;
        guildEntity.command_channels = [];

        const guildRepository = AppDataSource.getRepository(GuildEntity);
        await guildRepository.save(guildEntity);

        const commands = await guild.commands.set(handlers?.guildData ?? []);

        await CommandRepository.replaceGuildCommands(
            commands.values(),
            guild.id
        );
    }
}
