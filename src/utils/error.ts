/**
 * 未授权错误类
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
    this.message = message
  }
}