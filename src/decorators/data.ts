import { Collection } from "discord.js";

import { CommandHandler } from "./Command";
import { ButtonHandler } from "./Button";
import { DataFactory } from "./CommandData";
import { EventKey, EventHandlerType } from "./EventHandler";
import { UpdateHook } from "./AfterCommandUpdate";
import { JobBody } from "./ScheduledJob";

export const commands = new Collection<string, CommandHandler>();

export const adminCommands = new Set<string>();

export const buttons = new Collection<string, ButtonHandler>();

export const globalCommandsData = new Set<DataFactory>();
export const guildCommandsData = new Set<DataFactory>();

export const eventHandlers = {} as {
    [K in EventKey]: Set<EventHandlerType<K>>;
};

export const updateHooks = new Set<UpdateHook>();

export const jobs = new Collection<string, JobBody>();
