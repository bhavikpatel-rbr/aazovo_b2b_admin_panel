export type SuccessResponse<T> = {
  code: number
  message: string
  data: T
}

export interface ErrorResponse {
  status?: number | string
  statusText?: string
}

export const createSuccessResponse = <T>(
  code: number,
  message: string,
  data: T
): SuccessResponse<T> => ({
  code,
  message,
  data,
})