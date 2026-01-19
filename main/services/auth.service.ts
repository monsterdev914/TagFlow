/**
 * Authentication Service
 * Business logic for user authentication
 */

import { UserRepository } from '../repositories/user.repository';
import { LoginResult } from '../types';
import { AuthenticationError } from '../utils/errors';

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Authenticate user with username and password
   */
  async login(username: string, password: string): Promise<LoginResult> {
    if (!username.trim() || !password.trim()) {
      return {
        success: false,
        error: 'Username and password are required',
      };
    }

    const userResult = await this.userRepository.findByUsername(username);

    if (!userResult.success || !userResult.user) {
      return {
        success: false,
        error: userResult.error || 'Invalid credentials',
      };
    }

    // In a real application, you would hash and compare passwords securely
    // For now, simple comparison (should use bcrypt or similar)
    if (userResult.user.password !== password) {
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    return {
      success: true,
    };
  }

  /**
   * Logout user (placeholder for future session management)
   */
  async logout(): Promise<LoginResult> {
    // Add any logout cleanup logic here if needed
    // For now, just return success
    return { success: true };
  }

  /**
   * Update username
   */
  async updateUsername(currentUsername: string, newUsername: string, password: string): Promise<LoginResult> {
    if (!currentUsername.trim() || !newUsername.trim() || !password.trim()) {
      return {
        success: false,
        error: 'Current username, new username, and password are required',
      };
    }

    if (newUsername.trim().length < 1 || newUsername.trim().length > 50) {
      return {
        success: false,
        error: 'Username must be between 1 and 50 characters',
      };
    }

    // Verify current credentials
    const loginResult = await this.login(currentUsername, password);
    if (!loginResult.success) {
      return {
        success: false,
        error: 'Invalid current credentials',
      };
    }

    // Get current user
    const userResult = await this.userRepository.findByUsername(currentUsername);
    if (!userResult.success || !userResult.user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Check if new username already exists (only if different from current)
    if (newUsername.trim().toLowerCase() !== currentUsername.trim().toLowerCase()) {
      const existingUser = await this.userRepository.findByUsername(newUsername.trim());
      if (existingUser.success && existingUser.user) {
        return {
          success: false,
          error: 'Username already exists',
        };
      }
    }

    // Update username
    const updateResult = await this.userRepository.update(userResult.user.id, {
      username: newUsername.trim(),
    });

    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error || 'Failed to update username',
      };
    }

    return {
      success: true,
    };
  }

  /**
   * Update password
   */
  async updatePassword(username: string, currentPassword: string, newPassword: string): Promise<LoginResult> {
    if (!username.trim() || !currentPassword.trim() || !newPassword.trim()) {
      return {
        success: false,
        error: 'Username, current password, and new password are required',
      };
    }

    if (newPassword.trim().length < 1 || newPassword.trim().length > 50) {
      return {
        success: false,
        error: 'Password must be between 1 and 50 characters',
      };
    }

    // Verify current credentials
    const loginResult = await this.login(username, currentPassword);
    if (!loginResult.success) {
      return {
        success: false,
        error: 'Invalid current credentials',
      };
    }

    // Get current user
    const userResult = await this.userRepository.findByUsername(username);
    if (!userResult.success || !userResult.user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Update password
    const updateResult = await this.userRepository.update(userResult.user.id, {
      password: newPassword.trim(),
    });

    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error || 'Failed to update password',
      };
    }

    return {
      success: true,
    };
  }
}
