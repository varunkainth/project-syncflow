import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, Loader2, Monitor, Smartphone, Globe, Trash2, LogOut, History, Link2, Github } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useChangePassword } from "@/modules/auth/hooks/useUser";
import { useSessions, useRevokeSession, useRevokeAllSessions, useAuditLogs, useLinkedAccounts, useUnlinkAccount } from "@/modules/auth/hooks/useSecurity";
import { TwoFactorSection } from "./TwoFactorSection";

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Globe className="h-4 w-4" />;
    if (userAgent.toLowerCase().includes("mobile")) return <Smartphone className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
};

const formatAction = (action: string) => {
    const actions: Record<string, string> = {
        login: "Logged in",
        logout: "Logged out",
        signup: "Account created",
        login_failed: "Failed login attempt",
        password_changed: "Password changed",
        password_reset: "Password reset",
        password_reset_requested: "Password reset requested",
        "2fa_enabled": "2FA enabled",
        "2fa_disabled": "2FA disabled",
        session_revoked: "Session revoked",
        all_sessions_revoked: "All sessions revoked",
        oauth_login: "OAuth login",
        oauth_signup: "OAuth signup",
        oauth_linked: "OAuth account linked",
        oauth_unlinked: "OAuth account unlinked",
    };
    return actions[action] || action;
};

export function SecurityPage() {
    const changePassword = useChangePassword();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const { data: sessions, isLoading: sessionsLoading } = useSessions();
    const { data: auditLogs, isLoading: logsLoading } = useAuditLogs();
    const { data: linkedAccounts, isLoading: accountsLoading } = useLinkedAccounts();
    const revokeSession = useRevokeSession();
    const revokeAllSessions = useRevokeAllSessions();
    const unlinkAccount = useUnlinkAccount();

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    });

    const onPasswordSubmit = async (data: PasswordFormValues) => {
        try {
            await changePassword.mutateAsync({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast.success("Password changed successfully");
            passwordForm.reset();
        } catch (error: any) {
            toast.error(error.message || "Failed to change password");
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            await revokeSession.mutateAsync(sessionId);
            toast.success("Session revoked");
        } catch {
            toast.error("Failed to revoke session");
        }
    };

    const handleRevokeAll = async () => {
        try {
            await revokeAllSessions.mutateAsync();
            toast.success("All sessions revoked. Please log in again.");
        } catch {
            toast.error("Failed to revoke sessions");
        }
    };

    const handleUnlink = async (provider: string) => {
        try {
            await unlinkAccount.mutateAsync(provider);
            toast.success(`${provider} account unlinked`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to unlink account");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Security</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your password, sessions, and security preferences.
                </p>
            </div>
            <div className="border-t" />

            {/* Change Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="max-w-md space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Enter current password"
                                    className="pr-10"
                                    {...passwordForm.register("currentPassword")}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {passwordForm.formState.errors.currentPassword && (
                                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    className="pr-10"
                                    {...passwordForm.register("newPassword")}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {passwordForm.formState.errors.newPassword && (
                                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                {...passwordForm.register("confirmPassword")}
                            />
                            {passwordForm.formState.errors.confirmPassword && (
                                <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button type="submit" disabled={changePassword.isPending}>
                            {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Change Password
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <TwoFactorSection />

            {/* Active Sessions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            Active Sessions
                        </CardTitle>
                        <CardDescription>Manage your active login sessions</CardDescription>
                    </div>
                    {sessions && sessions.length > 1 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Revoke All
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke all sessions?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will log you out from all devices including this one.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRevokeAll}>Revoke All</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardHeader>
                <CardContent>
                    {sessionsLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : sessions?.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No active sessions</p>
                    ) : (
                        <div className="space-y-3">
                            {sessions?.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getDeviceIcon(session.userAgent)}
                                        <div>
                                            <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]">
                                                {session.userAgent || "Unknown device"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {session.ipAddress} • {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRevokeSession(session.id)}
                                        disabled={revokeSession.isPending}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Linked Accounts */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Linked Accounts
                    </CardTitle>
                    <CardDescription>Manage connected OAuth providers</CardDescription>
                </CardHeader>
                <CardContent>
                    {accountsLoading ? (
                        <Skeleton className="h-12 w-full" />
                    ) : linkedAccounts?.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No linked accounts</p>
                    ) : (
                        <div className="space-y-3">
                            {linkedAccounts?.map((account) => (
                                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {account.provider === "github" ? (
                                            <Github className="h-5 w-5" />
                                        ) : (
                                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                            </svg>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium capitalize">{account.provider}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Connected {formatDistanceToNow(new Date(account.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUnlink(account.provider)}
                                        disabled={unlinkAccount.isPending}
                                    >
                                        Unlink
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Audit Logs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Security Activity
                    </CardTitle>
                    <CardDescription>Recent security events on your account</CardDescription>
                </CardHeader>
                <CardContent>
                    {logsLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    ) : auditLogs?.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No activity yet</p>
                    ) : (
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-2">
                                {auditLogs?.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                        <div>
                                            <p className="text-sm font-medium">{formatAction(log.action)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {log.ipAddress} • {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {log.action.includes("failed") && (
                                            <Badge variant="destructive">Failed</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
