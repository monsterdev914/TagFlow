import { getUserByUsername } from './database';

export const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await getUserByUsername(username);
        if (!result.success || !result.user) {
            return { success: false, error: result.error || 'User not found' };
        }

        // Verify password
        if (result.user.password !== password) {
            return { success: false, error: 'Invalid password' };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
