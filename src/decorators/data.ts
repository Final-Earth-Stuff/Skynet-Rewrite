import { Collection, ApplicationCommandData } from "discord.js";

import { CommandHandler } from "./Command";
import { UpdateHook } from "./AfterCommandUpdate";
import { JobBody } from "./ScheduledJob";

export const commands = new Collection<string, CommandHandler>();

export const adminCommands = new Set<string>();

export const globalCommandsData = new Array<ApplicationCommandData>();
export const guildCommandsData = new Array<ApplicationCommandData>();

export const updateHooks = new Set<UpdateHook>();

export const jobs = new Collection<string, JobBody[]>();

export const optionCompletionMap = new Collection<
    string,
    Collection<string, string>
>();
