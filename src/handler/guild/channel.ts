import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types/v10";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { CommandHandler, SubCommand, CommandData } from "../../decorators";
import { BotError } from "../../error";

import { AppDataSource } from "../..";
import { Guild as GuildEntity } from "../../entity/Guild";
import { Color } from "../../service/util/constants";

@CommandHandler({ name: "channel" })
export class Channel {
    @CommandData({ type: "guild" })
    readonly data = new SlashCommandBuilder()
        .setName("channel")
        .setDescription("Configure channels")
        .setDefaultPermission(false)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Add new channel")
                .addStringOption((option) =>
                    option
                        .setName("type")
                        .setDescription("Which type of channel to configure")
                        .setRequired(true)
                        .addChoices([
                            ["Log", "log"],
                            ["Verify", "verify"],
                            ["Troop Movements", "troop_movement"],
                            ["Facility Updates", "land_facility"],
                            ["Command", "command"],
                        ])
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Which channel to use")
                        // broken typings :/
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        .addChannelType(ChannelType.GuildText as any)
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Unset a configured channel")
                .addStringOption((option) =>
                    option
                        .setName("type")
                        .setDescription("Which type of channel to unset")
                        .setRequired(true)
                        .addChoices([
                            ["Log", "log"],
                            ["Verify", "verify"],
                            ["Troop Movements", "troop_movement"],
                            ["Facility Updates", "land_facility"],
                            ["Command", "command"],
                        ])
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Which channel to use")
                        // broken typings :/
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        .addChannelType(ChannelType.GuildText as any)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("info")
                .setDescription("List configured channels")
        )
        .toJSON();

    @SubCommand({ name: "add" })
    async channelAdd(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const channel = interaction.options.getChannel("channel", true);
        const type = interaction.options.getString("type", true);

        if (type === "command") {
            await this.commandChannelAdd(interaction, channel.id);
        } else {
            await this.uniqueChannelAdd(interaction, channel.id, type);
        }
    }

    async commandChannelAdd(
        interaction: CommandInteraction,
        channelID: string
    ): Promise<void> {
        const guildRepository = AppDataSource.getRepository(GuildEntity);
        const guildEntity = await guildRepository.findOneOrFail({
            where: { guild_id: interaction.guildId ?? "" },
        });

        if (guildEntity.command_channels.includes(channelID)) {
            throw new BotError(
                `Channel <#${channelID}> already is a command channel`
            );
        }
        guildEntity.command_channels.push(channelID);

        guildRepository.save(guildEntity);

        const success = new MessageEmbed()
            .setDescription(
                `Successfully added command channel <#${channelID}>!`
            )
            .setColor(Color.GREEN);
        await interaction.editReply({ embeds: [success] });
    }

    async uniqueChannelAdd(
        interaction: CommandInteraction,
        channelID: string,
        type: string
    ): Promise<void> {
        const guildRepository = AppDataSource.getRepository(GuildEntity);

        await guildRepository.update(interaction.guildId ?? "", {
            [`${type}_channel`]: channelID,
        });

        const success = new MessageEmbed()
            .setDescription(
                `Successfully set ${type} channel to <#${channelID}>!`
            )
            .setColor(Color.GREEN);

        await interaction.editReply({ embeds: [success] });
    }

    @SubCommand({ name: "remove" })
    async channelRemove(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const channel = interaction.options.getChannel("channel");
        const type = interaction.options.getString("type", true);

        if (type === "command") {
            if (!channel) throw new BotError("No channel provided");
            await this.commandChannelRemove(interaction, channel.id);
        } else {
            await this.uniqueChannelRemove(interaction, type);
        }
    }

    async commandChannelRemove(
        interaction: CommandInteraction,
        channelID: string
    ): Promise<void> {
        const guildRepository = AppDataSource.getRepository(GuildEntity);
        const guildEntity = await guildRepository.findOneOrFail({
            where: { guild_id: interaction.guildId ?? "" },
        });

        if (!guildEntity.command_channels.includes(channelID)) {
            throw new BotError(
                `Channel <#${channelID}> isn't a command channel`
            );
        }
        guildEntity.command_channels = guildEntity.command_channels.filter(
            (c) => c !== channelID
        );

        guildRepository.save(guildEntity);

        const success = new MessageEmbed()
            .setDescription(
                `Successfully removed command channel <#${channelID}>!`
            )
            .setColor(Color.GREEN);
        await interaction.editReply({ embeds: [success] });
    }

    async uniqueChannelRemove(
        interaction: CommandInteraction,
        type: string
    ): Promise<void> {
        const guildRepository = AppDataSource.getRepository(GuildEntity);

        await guildRepository.update(interaction.guildId ?? "", {
            [`${type}_channel`]: null,
        });

        const success = new MessageEmbed()
            .setDescription(`Successfully unset ${type} channel!`)
            .setColor(Color.GREEN);

        await interaction.editReply({ embeds: [success] });
    }

    @SubCommand({ name: "info" })
    async channelInfo(interaction: CommandInteraction): Promise<void> {
        const guildRepository = AppDataSource.getRepository(GuildEntity);
        const guild = await guildRepository.findOneOrFail({
            where: { guild_id: interaction.guildId ?? "" },
        });

        const embed = new MessageEmbed()
            .setTitle("Channels")
            .addField(
                "Verify",
                guild.verify_channel
                    ? `<#${guild.verify_channel}>`
                    : "Not configured",
                true
            )
            .addField(
                "Troop Movements",
                guild.troop_movement_channel
                    ? `<#${guild.troop_movement_channel}>`
                    : "Not configured",
                true
            )
            .addField(
                "Facility Updates",
                guild.land_facility_channel
                    ? `<#${guild.land_facility_channel}>`
                    : "Not configured",
                true
            )
            .addField(
                "Log",
                guild.log_channel
                    ? `<#${guild.log_channel}>`
                    : "Not configured",
                true
            )
            .addField(
                "Command",
                guild.command_channels.length > 0
                    ? guild.command_channels.map((r) => `<#${r}>`).join(" ")
                    : "Not configured"
            )
            .setColor(Color.BLUE);

        await interaction.reply({ embeds: [embed] });
    }
}
