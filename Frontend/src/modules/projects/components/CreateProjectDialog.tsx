import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming we have this, if not I'll use Input or create it
import { useCreateProject } from "../hooks/useProjects";
import { createProjectSchema, type CreateProjectFormValues } from "../schema";

export function CreateProjectDialog() {
    const [open, setOpen] = useState(false);
    const { mutate: createProject, isPending } = useCreateProject();

    const form = useForm<CreateProjectFormValues>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    function onSubmit(data: CreateProjectFormValues) {
        createProject(data, {
            onSuccess: () => {
                setOpen(false);
                form.reset();
                toast.success("Project created successfully!", {
                    description: `Project "${data.name}" has been created.`,
                });
            },
            onError: (error) => {
                toast.error("Failed to create project", {
                    description: error.message,
                });
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                    <DialogDescription>
                        Add a new project to your workspace.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Project Alpha" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="A brief description..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Project
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
