import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { decryptPayload } from "@/utils/encryption";
import { api } from "@/lib/api";
import { useUser, useInvalidateUser } from "@/modules/auth/hooks/useUser";

const verifySchema = z.object({
    code: z.string().length(6, "Code must be 6 digits"),
});

type VerifyFormValues = z.infer<typeof verifySchema>;

export function TwoFactorSection() {
    const { data: user, isLoading } = useUser();
    const invalidateUser = useInvalidateUser();

    const [isEnabling, setIsEnabling] = useState(false);
    const [qrData, setQrData] = useState<{ secret: string; otpauth: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isDisabling, setIsDisabling] = useState(false);

    const verifyForm = useForm<VerifyFormValues>({
        resolver: zodResolver(verifySchema),
        defaultValues: {
            code: "",
        },
    });

    const handleStartEnable = async () => {
        setIsGenerating(true);
        try {
            const response = await api.post("/auth/2fa/generate");
            const decryptedData = decryptPayload(response.data.data);
            setQrData(decryptedData as { secret: string; otpauth: string });
            setIsEnabling(true);
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.error || "Failed to generate 2FA secret",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleVerify = async (data: VerifyFormValues) => {
        setIsVerifying(true);
        try {
            await api.post("/auth/2fa/verify", { code: data.code });
            toast.success("2FA Enabled", {
                description: "Two-factor authentication has been successfully enabled.",
            });
            setIsEnabling(false);
            setQrData(null);
            verifyForm.reset();
            invalidateUser();
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.error || "Invalid code",
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleDisable = async () => {
        setIsDisabling(true);
        try {
            await api.post("/auth/2fa/disable");
            toast.success("2FA Disabled", {
                description: "Two-factor authentication has been disabled.",
            });
            invalidateUser();
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.error || "Failed to disable 2FA",
            });
        } finally {
            setIsDisabling(false);
        }
    };

    if (isLoading) {
        return null; // Or skeleton
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Two-Factor Authentication
                    </CardTitle>
                    <CardDescription>
                        Add an extra layer of security to your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user?.isTwoFactorEnabled ? (
                        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                            <div className="space-y-0.5">
                                <Label className="text-base">Two-factor authentication is enabled</Label>
                                <p className="text-sm text-muted-foreground">
                                    Your account is secured with 2FA.
                                </p>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="destructive">Disable 2FA</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Disable 2FA?</DialogTitle>
                                        <DialogDescription>
                                            Are you sure you want to disable two-factor authentication? This will make your account less secure.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => { }}>Cancel</Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDisable}
                                            disabled={isDisabling}
                                        >
                                            {isDisabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Disable
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Enable 2FA</Label>
                                <p className="text-sm text-muted-foreground">
                                    Secure your account with TOTP (Google Authenticator, etc.)
                                </p>
                            </div>
                            <Dialog open={isEnabling} onOpenChange={(open) => {
                                if (!open) {
                                    setIsEnabling(false);
                                    setQrData(null);
                                    verifyForm.reset();
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button onClick={handleStartEnable} disabled={isGenerating}>
                                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Setup 2FA
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                                        <DialogDescription>
                                            Scan the QR code below with your authenticator app (like Google Authenticator or Authy).
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col items-center justify-center space-y-4 py-4">
                                        {qrData ? (
                                            <>
                                                <div className="bg-white p-4 rounded-lg">
                                                    <QRCodeSVG value={qrData.otpauth} size={200} />
                                                </div>
                                                <div className="text-center space-y-2">
                                                    <p className="text-sm text-muted-foreground">Or enter this code manually:</p>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <code className="bg-muted px-3 py-2 rounded text-lg font-mono font-bold tracking-wider select-all">
                                                            {qrData.secret}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(qrData.secret);
                                                                toast.success("Copied to clipboard");
                                                            }}
                                                            title="Copy to clipboard"
                                                        >
                                                            <div className="h-4 w-4 i-lucide-copy" />
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="24"
                                                                height="24"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                className="h-4 w-4"
                                                            >
                                                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                                            </svg>
                                                        </Button>
                                                    </div>
                                                </div>
                                                <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="w-full space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="code">Verify Code</Label>
                                                        <Input
                                                            id="code"
                                                            placeholder="Enter 6-digit code"
                                                            {...verifyForm.register("code")}
                                                            maxLength={6}
                                                            className="text-center text-lg tracking-widest"
                                                        />
                                                        {verifyForm.formState.errors.code && (
                                                            <p className="text-sm text-destructive text-center">
                                                                {verifyForm.formState.errors.code.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button type="submit" className="w-full" disabled={isVerifying}>
                                                        {isVerifying ? (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                                        )}
                                                        Verify and Enable
                                                    </Button>
                                                </form>
                                            </>
                                        ) : (
                                            <div className="flex h-[200px] w-full items-center justify-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
