import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/modules/auth/hooks/useUser";
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

export function SecurityPage() {
    const changePassword = useChangePassword();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onPasswordSubmit = async (data: PasswordFormValues) => {
        try {
            await changePassword.mutateAsync({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast.success("Password changed", {
                description: "Your password has been changed successfully.",
            });
            passwordForm.reset();
        } catch (error: any) {
            toast.error("Error", {
                description: error.message || "Failed to change password",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Security</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your password and security preferences.
                </p>
            </div>
            <div className="border-t" />
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                    </CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="max-w-md space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Enter current password"
                                    className="pl-10 pr-10"
                                    {...passwordForm.register("currentPassword")}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {passwordForm.formState.errors.currentPassword && (
                                <p className="text-sm text-destructive">
                                    {passwordForm.formState.errors.currentPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    className="pl-10 pr-10"
                                    {...passwordForm.register("newPassword")}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {passwordForm.formState.errors.newPassword && (
                                <p className="text-sm text-destructive">
                                    {passwordForm.formState.errors.newPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    className="pl-10"
                                    {...passwordForm.register("confirmPassword")}
                                />
                            </div>
                            {passwordForm.formState.errors.confirmPassword && (
                                <p className="text-sm text-destructive">
                                    {passwordForm.formState.errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-start">
                            <Button
                                type="submit"
                                disabled={changePassword.isPending}
                            >
                                {changePassword.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Lock className="mr-2 h-4 w-4" />
                                )}
                                Change Password
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <TwoFactorSection />
        </div>
    );
}
