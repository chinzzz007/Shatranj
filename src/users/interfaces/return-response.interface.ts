export interface ReturnResponse{
    success: boolean,
    status_code: number,
    message: string,
    error?: string,
    short_lived_token?: string,
    data?: Record<string, any>
}