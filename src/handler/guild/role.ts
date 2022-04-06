import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Guild, MessageEmbed } from "discord.js";
import { getCustomRepository } from "typeorm";

import {
    Command,
    CommandData,
    OnCommandUpdate,
    EventHandler,
} from "../../decorators";
import { BotError } from "../../error";

import { CommandRepository } from "../../repository/CommandRepository";
import { PermissionRepository } from "../../repository/PermissionRepository";
import { PermissionType, Permission } from "../../entity/Permission";

async function mergePermissions(
    guild: Guild,
    commandIds: string[],
    id: string,
    type: "ROLE" | "USER"
) {
    const previous = await guild.commands.permissions.fetch({});
    commandIds.forEach((commandId) => {
        const perms = previous.get(commandId) ?? [];
        perms.push({ id, type, permission: true });
        previous.set(commandId, perms);
    });

    await guild.commands.permissions.set({
        fullPermissions: previous.map((permissions, id) => ({
            id,
            permissions,
        })),
    });
}

async function dropPermissions(
    guild: Guild,
    commandIds: string[],
    id: string,
    type: "ROLE" | "USER"
) {
    const previous = await guild.commands.permissions.fetch({});
    commandIds.forEach((commandId) => {
        let perms = previous.get(commandId) ?? [];
        perms = perms.filter((perm) => perm.id !== id && perm.type !== type);
        previous.set(commandId, perms);
    });

    await guild.commands.permissions.set({
        fullPermissions: previous.map((permissions, id) => ({
            id,
            permissions,
        })),
    });
}

export class Role {
    static MODERATOR_COMMANDS = ["role"];

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

    @Command({ name: "role" })
    async role(interaction: CommandInteraction): Promise<void> {
        const subCommand = interaction.options.getSubcommand(true);

        switch (subCommand) {
            case "add":
                await this.roleAdd(interaction);
                break;

            case "remove":
                await this.roleRemove(interaction);
                break;
            default:
                throw new BotError("Not implemented");
        }
    }

    async roleAdd(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const role = interaction.options.getRole("role", true);

        switch (interaction.options.getString("type")) {
            case "admin": {
                const commandRepository =
                    getCustomRepository(CommandRepository);
                const commandIds =
                    await commandRepository.getGuildCommandIdsByName(
                        Role.MODERATOR_COMMANDS,
                        interaction.guildId
                    );
                if (!commandIds || !interaction.guild)
                    throw new BotError("Something went wrong");

                await mergePermissions(
                    interaction.guild,
                    commandIds,
                    role.id,
                    "ROLE"
                );

                const permissionRepository =
                    getCustomRepository(PermissionRepository);

                // repository upsert is broken
                await permissionRepository
                    .createQueryBuilder()
                    .insert()
                    .into(Permission)
                    .values(
                        commandIds.map((command_id) => ({
                            id: role.id,
                            type: PermissionType.ROLE,
                            command: { command_id },
                        }))
                    )
                    .orUpdate(["id"], ["id", "command_id"])
                    .execute();

                const success = new MessageEmbed()
                    .setDescription(
                        `Successfully added admin role <@&${role.id}>!`
                    )
                    .setColor("DARK_GREEN");
                await interaction.editReply({ embeds: [success] });
                return;
            }
            default:
                throw new BotError("Not implemented");
        }
    }

    async roleRemove(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const role = interaction.options.getRole("role");

        switch (interaction.options.getString("type")) {
            case "admin": {
                const commandRepository =
                    getCustomRepository(CommandRepository);
                const commandIds =
                    await commandRepository.getGuildCommandIdsByName(
                        Role.MODERATOR_COMMANDS,
                        interaction.guildId
                    );

                if (!role) throw new BotError("No role selected");

                if (!commandIds || !interaction.guild)
                    throw new BotError("Something went wrong");

                await dropPermissions(
                    interaction.guild,
                    commandIds,
                    role.id,
                    "ROLE"
                );

                const permissionRepository =
                    getCustomRepository(PermissionRepository);

                await permissionRepository.delete({ id: role.id });

                const success = new MessageEmbed()
                    .setDescription(
                        `Successfully removed admin role <@&${role.id}>!`
                    )
                    .setColor("DARK_GREEN");
                await interaction.editReply({ embeds: [success] });

                return;
            }
            default:
                throw new BotError("Not implemented");
        }
    }

    async roleInfo(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
    }

    @OnCommandUpdate()
    @EventHandler({ event: "guildCreate" })
    async setPermission(guild: Guild) {
        const commandRepository = getCustomRepository(CommandRepository);

        const commandIds = await commandRepository.getGuildCommandIdsByName(
            Role.MODERATOR_COMMANDS,
            guild.id
        );
        if (!commandIds) return; /* This shouldn't happen */

        await mergePermissions(guild, commandIds, guild.ownerId, "USER");

        const permissionRepository = getCustomRepository(PermissionRepository);

        await permissionRepository.insert(
            commandIds.map((command_id) => ({
                id: guild.ownerId,
                type: PermissionType.USER,
                command: { command_id },
            }))
        );
    }
}
