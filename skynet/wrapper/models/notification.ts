import * as t from "io-ts";
import { Statistics, Timers } from "./common";

export const QueuedTrain = t.type({
    ID: t.string,
    stat: t.string,
});

export const Training = t.type({
    stats: Statistics,
    queueSize: t.number,
    modifiedStats: t.type({
        communication: t.string,
        intelligence: t.string,
        leadership: t.string,
        strength: t.string,
        info: t.string,
    }),
    endTime: t.number,
    hasUpdated: t.boolean,
    currentlyTraining: t.union([t.string, t.number]),
    queued: t.array(QueuedTrain),
    serverTime: t.number,
});

export const NotificationData = t.type({
    timers: Timers,
    training: Training,
    unreadMails: t.number,
    unreadEvents: t.number,
});

export type NotificationData = t.TypeOf<typeof NotificationData>;
