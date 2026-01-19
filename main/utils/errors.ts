/**
 * Error Utilities
 * Centralized error handling and error types
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Format error for IPC response
 */
export function formatError(error: unknown): { success: false; error: string } {
  if (error instanceof AppError) {
    return { success: false, error: error.message };
  }
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  return { success: false, error: 'An unknown error occurred' };
}

/**
 * Wrap async function with error handling
 */
export async function handleAsync<T>(
  fn: () => Promise<T>
): Promise<{ success: boolean; error?: string; data?: T }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return formatError(error);
  }
}
