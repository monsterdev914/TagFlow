/**
 * Settings Page
 * Allows users to change their username and password
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Key, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Setting: React.FC = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [currentUsername, setCurrentUsername] = useState('');

    // Username change state
    const [newUsername, setNewUsername] = useState('');
    const [usernamePassword, setUsernamePassword] = useState('');
    const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

    // Password change state
    const [passwordChangeUsername, setPasswordChangeUsername] = useState('');
    const [currentPasswordForChange, setCurrentPasswordForChange] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const handleUpdateUsername = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUsername.trim() || !newUsername.trim() || !usernamePassword.trim()) {
            toast({
                title: 'Error',
                description: 'Please fill in all fields',
                variant: 'destructive',
            });
            return;
        }

        if (newUsername.trim().length < 1 || newUsername.trim().length > 50) {
            toast({
                title: 'Error',
                description: 'Username must be between 1 and 50 characters',
                variant: 'destructive',
            });
            return;
        }

        setIsUpdatingUsername(true);
        try {
            if (!window.electronAPI || typeof window.electronAPI.updateUsername !== 'function') {
                throw new Error('Electron API not available. Please restart the application.');
            }

            const result = await window.electronAPI.updateUsername(
                currentUsername.trim(),
                newUsername.trim(),
                usernamePassword
            );

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Username updated successfully',
                });
                setCurrentUsername('');
                setNewUsername('');
                setUsernamePassword('');
                navigate('/login');
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to update username',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: (error as Error).message || 'Failed to update username',
                variant: 'destructive',
            });
        } finally {
            setIsUpdatingUsername(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwordChangeUsername.trim() || !currentPasswordForChange.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
            toast({
                title: 'Error',
                description: 'Please fill in all fields',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword.trim().length < 1 || newPassword.trim().length > 50) {
            toast({
                title: 'Error',
                description: 'Password must be between 1 and 50 characters',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword !== confirmNewPassword) {
            toast({
                title: 'Error',
                description: 'New passwords do not match',
                variant: 'destructive',
            });
            return;
        }

        setIsUpdatingPassword(true);
        try {
            if (!window.electronAPI || typeof window.electronAPI.updatePassword !== 'function') {
                throw new Error('Electron API not available. Please restart the application.');
            }

            const result = await window.electronAPI.updatePassword(
                passwordChangeUsername.trim(),
                currentPasswordForChange,
                newPassword
            );

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Password updated successfully',
                });
                setPasswordChangeUsername('');
                setCurrentPasswordForChange('');
                setNewPassword('');
                setConfirmNewPassword('');
                navigate('/login');
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to update password',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: (error as Error).message || 'Failed to update password',
                variant: 'destructive',
            });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account credentials
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Change Username Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            <CardTitle>Change Username</CardTitle>
                        </div>
                        <CardDescription>
                            Update your account username
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateUsername} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-username">Current Username</Label>
                                <Input
                                    id="current-username"
                                    type="text"
                                    placeholder="Enter current username"
                                    value={currentUsername}
                                    onChange={(e) => setCurrentUsername(e.target.value)}
                                    disabled={isUpdatingUsername}
                                    autoComplete="username"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-username">New Username</Label>
                                <Input
                                    id="new-username"
                                    type="text"
                                    placeholder="Enter new username"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    disabled={isUpdatingUsername}
                                    autoComplete="username"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username-password">Password</Label>
                                <Input
                                    id="username-password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={usernamePassword}
                                    onChange={(e) => setUsernamePassword(e.target.value)}
                                    disabled={isUpdatingUsername}
                                    autoComplete="current-password"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isUpdatingUsername}
                            >
                                {isUpdatingUsername ? 'Updating...' : 'Update Username'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            <CardTitle>Change Password</CardTitle>
                        </div>
                        <CardDescription>
                            Update your account password
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password-username">Username</Label>
                                <Input
                                    id="password-username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={passwordChangeUsername}
                                    onChange={(e) => setPasswordChangeUsername(e.target.value)}
                                    disabled={isUpdatingPassword}
                                    autoComplete="username"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    placeholder="Enter current password"
                                    value={currentPasswordForChange}
                                    onChange={(e) => setCurrentPasswordForChange(e.target.value)}
                                    disabled={isUpdatingPassword}
                                    autoComplete="current-password"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isUpdatingPassword}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    disabled={isUpdatingPassword}
                                    autoComplete="new-password"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isUpdatingPassword}
                            >
                                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Setting;
