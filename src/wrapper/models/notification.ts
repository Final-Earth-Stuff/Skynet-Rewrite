import { Statistics, Timers } from "./common"

export interface NotificationData {
    timers: Timers,
    training: Training,
    unreadMails: number,
    unreadEvents: number
}

export interface Training {
    stats: Statistics,
    queueSize: number,
    modifiedStats: {
        communication: number,
        intelligence: number,
        leadership: number,
        strength: number,
        info: string
    },
    endTime: number,
    hasUpdated: boolean,
    currentlyTraining: number,
    queued: QueuedTrain[],
    serverTime: number
}

export interface QueuedTrain {
    ID: number,
    stat: number
}