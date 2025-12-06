import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    User,
    Mail,
    Phone,
    FileText,
    Loader2,
    Check,
    Camera,
    Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,

} from "@/components/ui/select";
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
import { useUser, useUpdateProfile } from "@/modules/auth/hooks/useUser";
import { api } from "@/lib/api";
import { useUpload } from "@/hooks/useUpload";

const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    bio: z.string().optional(),
    phoneNumber: z.string().optional(),
    avatarUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const COUNTRY_CODES = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+61", country: "Australia" },
    { code: "+81", country: "Japan" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "other", country: "Other" },
];

export function ProfilePage() {
    const { data: user, isLoading } = useUser();
    const updateProfile = useUpdateProfile();
    const upload = useUpload();

    const [countryCode, setCountryCode] = useState("+91");
    const [customCountryCode, setCustomCountryCode] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || "",
            bio: user?.bio || "",
            phoneNumber: user?.phoneNumber?.split(" ")[1] || user?.phoneNumber || "",
            avatarUrl: user?.avatarUrl || "",
        },
        values: {
            name: user?.name || "",
            bio: user?.bio || "",
            phoneNumber: user?.phoneNumber?.split(" ")[1] || user?.phoneNumber || "",
            avatarUrl: user?.avatarUrl || "",
        },
    });

    // Update country code if phone number exists and starts with known code
    useState(() => {
        if (user?.phoneNumber) {
            const phoneNumberParts = user.phoneNumber.split(" ");
            // If we have a space separated part, checks the first part
            if (phoneNumberParts.length > 1) {
                const existingCode = phoneNumberParts[0];
                const found = COUNTRY_CODES.find(c => c.code === existingCode);
                if (found) {
                    setCountryCode(existingCode);
                } else {
                    // It's a custom code
                    setCountryCode("other");
                    setCustomCountryCode(existingCode);
                }
            }
        }
    });

    const onProfileSubmit = async (data: ProfileFormValues) => {
        try {
            let finalCode = countryCode;
            if (countryCode === "other") {
                if (!customCountryCode.startsWith("+")) {
                    finalCode = "+" + customCountryCode;
                } else {
                    finalCode = customCountryCode;
                }
            }

            const formattedPhone = data.phoneNumber ? `${finalCode} ${data.phoneNumber}` : undefined;
            await updateProfile.mutateAsync({
                ...data,
                phoneNumber: formattedPhone,
            });
            toast.success("Profile updated", {
                description: "Your profile has been updated successfully.",
            });
        } catch (error: any) {
            toast.error("Error", {
                description: error.message || "Failed to update profile",
            });
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            toast.loading("Uploading avatar...");
            const url = await upload.mutateAsync(file);

            // Update profile with new avatar URL
            await updateProfile.mutateAsync({
                ...profileForm.getValues(),
                avatarUrl: url,
            });

            toast.dismiss();
            toast.success("Avatar updated", {
                description: "Your profile picture has been updated.",
            });
        } catch (error: any) {
            toast.dismiss();
            toast.error("Upload failed", {
                description: error.message || "Failed to upload avatar",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
                <p className="text-muted-foreground">
                    Manage your public profile information.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile Card */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Your Profile</CardTitle>
                        <CardDescription>
                            Your public profile information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center text-center">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-2 border-border">
                                <AvatarImage src={user?.avatarUrl} className="object-cover" />
                                <AvatarFallback className="text-2xl">
                                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={upload.isPending}
                            >
                                {upload.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Camera className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{user?.name || "No name set"}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        {user?.bio && (
                            <p className="mt-2 text-sm text-muted-foreground">{user.bio}</p>
                        )}
                        <Separator className="my-4" />
                        <div className="w-full space-y-2 text-left text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>{user?.email}</span>
                            </div>
                            {user?.phoneNumber && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span>{user.phoneNumber}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Profile Form */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Edit Profile</CardTitle>
                        <CardDescription>
                            Update your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="Your name"
                                        className="pl-10"
                                        {...profileForm.register("name")}
                                    />
                                </div>
                                {profileForm.formState.errors.name && (
                                    <p className="text-sm text-destructive">
                                        {profileForm.formState.errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        value={user?.email || ""}
                                        className="pl-10"
                                        disabled
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Email cannot be changed
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="flex gap-2">
                                    <div className="flex gap-2">
                                        <Select value={countryCode} onValueChange={setCountryCode}>
                                            <SelectTrigger className="w-[100px]">
                                                <SelectValue placeholder="Code" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COUNTRY_CODES.map((country) => (
                                                    <SelectItem key={country.code} value={country.code}>
                                                        <span className="flex items-center gap-2">
                                                            {country.code !== "other" && <span>{country.code}</span>}
                                                            <span className="text-muted-foreground text-xs hidden md:inline">{country.country}</span>
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {countryCode === "other" && (
                                            <Input
                                                placeholder="+XX"
                                                className="w-[80px]"
                                                value={customCountryCode}
                                                onChange={(e) => setCustomCountryCode(e.target.value)}
                                            />
                                        )}
                                    </div>
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            placeholder="Your phone number"
                                            className="pl-10"
                                            {...profileForm.register("phoneNumber")}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Textarea
                                        id="bio"
                                        placeholder="Tell us about yourself"
                                        className="min-h-[100px] pl-10"
                                        {...profileForm.register("bio")}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={updateProfile.isPending || upload.isPending}
                                >
                                    {(updateProfile.isPending || upload.isPending) ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-2 h-4 w-4" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-3 border-destructive/50">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription>
                            Irreversible actions for your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-destructive">Delete Account</h3>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and all associated data.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Delete Account</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        account and remove your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={async () => {
                                            try {
                                                await api.delete("/auth/account");
                                                window.location.href = "/auth/signup";
                                            } catch (error) {
                                                toast.error("Failed to delete account");
                                            }
                                        }}
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

