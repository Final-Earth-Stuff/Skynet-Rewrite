export interface FEResponse<T> {
    error: boolean,
    reason: boolean,
    data: T
}

export interface ErrorData {
    code: number
}

export interface Statistics {
    strength: number,
    intelligence: number,
    leadership: number,
    communication: number
}

export interface Timers {
    statistics: number,
    operations: number,
    politics: number,
    war: number,
    reimbursement: number
}