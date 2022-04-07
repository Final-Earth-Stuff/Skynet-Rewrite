export interface FEResponse<T> {
    error: boolean;
    reason: boolean | string;
    data: T;
}

export interface ErrorResponse {
    reason: string;
    error: true;
    data: {
        code: number;
    };
}

export const isErrorResponse = (
    response: FEResponse<unknown>
): response is ErrorResponse => response.error;

export interface Statistics {
    strength: number;
    intelligence: number;
    leadership: number;
    communication: number;
}

export interface Timers {
    statistics: number;
    operations: number;
    politics: number;
    war: number;
    reimbursement: number;
}
