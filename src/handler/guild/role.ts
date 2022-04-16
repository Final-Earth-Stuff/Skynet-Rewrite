import { SlashCommandBuilder } from "@discordjs/builders";
import type { REST } from "@discordjs/rest";
import {
    Routes,
    APIGuild,
    ApplicationCommandPermissionType,
} from "discord-api-types/v10";
import { CommandInteraction, Guild, MessageEmbed } from "discord.js";

import {
    Command,
    CommandData,
    AfterCommandUpdate,
    EventHandler,
} from "../../decorators";
import { BotError } from "../../error";
import { adminCommands, guildCommandsData } from "../../decorators/data";

import { AppDataSource } from "../..";
import { CommandRepository } from "../../repository/CommandRepository";
import { Guild as GuildEntity } from "../../entity/Guild";
import { Color } from "../../service/util/constants";

async function updatePermissionsForGuild(
    guildEntity: GuildEntity,
    guild: Guild
): Promise<void> {
    const commandIDs = await CommandRepository.getGuildCommandIdsByName(
        [...adminCommands],
        guild.id
    );

    const fullPermissions = commandIDs.map((commandID) => ({
        id: commandID,
        permissions: [
            {
                id: guild.ownerId,
                type: "USER" as const,
                permission: true,
            },
            ...guildEntity.admin_roles.map((id) => ({
                id,
                type: "ROLE" as const,
                permission: true,
            })),
        ],
    }));

    await guild.commands.permissions.set({
        fullPermissions,
    });
}

export class Role {
    @CommandData({ type: "guild" })
    roleData() {
        return new SlashCommandBuilder()
            .setName("role")
            .setDescription("Configure roles")
            .setDefaultPermission(false)
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("add")
                    .setDescription("Add new role")
                    .addStringOption((option) =>
                        option
                            .setName("type")
                            .setDescription("Which type of role to configure")
                            .setRequired(true)
                            .addChoices([
                                ["Allies", "allies"],
                                ["Axis", "axis"],
                                ["Spectator", "spectator"],
                                ["Bot admin", "admin"],
                            ])
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
                            .addChoices([
                                ["Allies", "allies"],
                                ["Axis", "axis"],
                                ["Spectator", "spectator"],
                                ["Bot admin", "admin"],
                            ])
                    )
                    .addRoleOption((option) =>
                        option
                            .setName("role")
                            .setDescription("Which role to remove")
                    )
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("info")
                    .setDescription("List configured roles")
            )
            .toJSON();
    }

    @Command({ name: "role", admin: true })
    async role(interaction: CommandInteraction): Promise<void> {
        const subCommand = interaction.options.getSubcommand(true);

        switch (subCommand) {
            case "add":
                await this.roleAdd(interaction);
                break;

            case "remove":
                await this.roleRemove(interaction);
                break;

            case "info":
                await this.roleInfo(interaction);
                break;
            default:
                throw new BotError("Not implemented");
        }
    }

    async roleAdd(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const role = interaction.options.getRole("role", true);
        const type = interaction.options.getString("type", true);

        if (type === "admin") {
            await this.adminRoleAdd(interaction, role.id);
        } else {
            await this.uniqueRoleAdd(interaction, role.id, type);
        }
    }

    async adminRoleAdd(
        interaction: CommandInteraction,
        roleID: string
    ): Promise<void> {
        await AppDataSource.createEntityManager().transaction(
            async (manager) => {
                const guildEntity = await manager.findOneOrFail(GuildEntity, {
                    where: { guild_id: interaction.guildId ?? "" },
                });

                if (guildEntity.admin_roles.includes(roleID)) {
                    throw new BotError(
                        `Role <@&${roleID}> already is an admin role`
                    );
                }
                guildEntity.admin_roles.push(roleID);

                if (!interaction.guild)
                    throw new BotError("Something went wrong");
                await updatePermissionsForGuild(guildEntity, interaction.guild);

                manager.save(GuildEntity, guildEntity);
            }
        );

        const success = new MessageEmbed()
            .setDescription(`Successfully added admin role <@&${roleID}>!`)
            .setColor(Color.GREEN);
        await interaction.editReply({ embeds: [success] });
    }

    async uniqueRoleAdd(
        interaction: CommandInteraction,
        roleID: string,
        type: string
    ): Promise<void> {
        const guildRepository = AppDataSource.getRepository(GuildEntity);

        await guildRepository.update(interaction.guildId ?? "", {
            [`${type}_role`]: roleID,
        });

        const success = new MessageEmbed()
            .setDescription(`Successfully set ${type} role to <@&${roleID}>!`)
            .setColor(Color.GREEN);

        await interaction.editReply({ embeds: [success] });
    }

    async roleRemove(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const role = interaction.options.getRole("role");
        const type = interaction.options.getString("type", true);

        if (type === "admin") {
            await this.adminRoleRemove(interaction, role?.id);
        } else {
            await this.uniqueRoleRemove(interaction, type);
        }
    }

    async adminRoleRemove(
        interaction: CommandInteraction,
        roleID: string | undefined
    ): Promise<void> {
        if (!roleID) throw new BotError("No role selected");

        await AppDataSource.createEntityManager().transaction(
            async (manager) => {
                const guildEntity = await manager.findOneOrFail(GuildEntity, {
                    where: { guild_id: interaction.guildId ?? "" },
                });
                if (!guildEntity.admin_roles.includes(roleID)) {
                    throw new BotError(
                        `Role <@&${roleID}> is not an admin role`
                    );
                }
                guildEntity.admin_roles = guildEntity.admin_roles.filter(
                    (r) => r !== roleID
                );

                if (!interaction.guild)
                    throw new BotError("Something went wrong");
                await updatePermissionsForGuild(guildEntity, interaction.guild);

                manager.save(GuildEntity, guildEntity);
            }
        );

        const success = new MessageEmbed()
            .setDescription(`Successfully removed admin role <@&${roleID}>!`)
            .setColor(Color.GREEN);
        await interaction.editReply({ embeds: [success] });
    }

    async uniqueRoleRemove(
        interaction: CommandInteraction,
        type: string
    ): Promise<void> {
        const guildRepository = AppDataSource.getRepository(GuildEntity);

        await guildRepository.update(interaction.guildId ?? "", {
            [`${type}_role`]: null,
        });

        const success = new MessageEmbed()
            .setDescription(`Successfully unset ${type} role!`)
            .setColor(Color.GREEN);

        await interaction.editReply({ embeds: [success] });
    }

    async roleInfo(interaction: CommandInteraction): Promise<void> {
        const guildRepository = AppDataSource.getRepository(GuildEntity);
        const guild = await guildRepository.findOneOrFail({
            where: { guild_id: interaction.guildId ?? "" },
        });

        const embed = new MessageEmbed()
            .setTitle("Roles")
            .addField(
                "Allies",
                guild.allies_role
                    ? `<@&${guild.allies_role}>`
                    : "Not configured",
                true
            )
            .addField(
                "Axis",
                guild.axis_role ? `<@&${guild.axis_role}>` : "Not configured",
                true
            )
            .addField(
                "Spectator",
                guild.spectator_role
                    ? `<@&${guild.spectator_role}>`
                    : "Not configured",
                true
            )
            .addField(
                "Admin",
                guild.admin_roles.length > 0
                    ? guild.admin_roles.map((r) => `<@&${r}>`).join(" ")
                    : "Not configured"
            )
            .setColor(Color.BLUE);

        await interaction.reply({ embeds: [embed] });
    }

    @EventHandler({ event: "guildCreate" })
    async setPermission(guild: Guild) {
        const guildEntity = new GuildEntity();
        guildEntity.guild_id = guild.id;
        guildEntity.admin_roles = [];
        guildEntity.command_channels = [];

        const guildRepository = AppDataSource.getRepository(GuildEntity);
        await guildRepository.save(guildEntity);

        const commands = await guild.commands.set(guildCommandsData);

        await CommandRepository.replaceGuildCommands(
            commands.values(),
            guild.id
        );

        await updatePermissionsForGuild(guildEntity, guild);
    }

    @AfterCommandUpdate()
    async migratePermissions(guild_id: string, app_id: string, rest: REST) {
        const guildRepository = AppDataSource.getRepository(GuildEntity);
        const guildEntity = await guildRepository.findOneByOrFail({
            guild_id,
        });

        const commandIDs = await CommandRepository.getGuildCommandIdsByName(
            [...adminCommands],
            guild_id
        );

        const guild = (await rest.get(Routes.guild(guild_id))) as APIGuild;

        const fullPermissions = commandIDs.map((commandID) => ({
            id: commandID,
            permissions: [
                {
                    id: guild.owner_id,
                    type: ApplicationCommandPermissionType.User,
                    permission: true,
                },
                ...guildEntity.admin_roles.map((id) => ({
                    id,
                    type: ApplicationCommandPermissionType.Role,
                    permission: true,
                })),
            ],
        }));

        await rest.put(
            Routes.guildApplicationCommandsPermissions(app_id, guild_id),
            { body: fullPermissions }
        );
    }
}
