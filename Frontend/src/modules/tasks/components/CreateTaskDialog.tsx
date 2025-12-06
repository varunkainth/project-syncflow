import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, UserCircle2, X, Calendar } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { createTaskSchema, type CreateTaskFormValues } from "../schema";
import { useCreateTask } from "../hooks/useTasks";
import { useProjectMembers } from "../../projects/hooks/useProjects";
import { getApiError } from "@/utils/errorHandler";
import { RecurrenceSelector, type RecurrenceRule } from "./RecurrenceSelector";

interface CreateTaskDialogProps {
    projectId: string;
}

export function CreateTaskDialog({ projectId }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false);
    const [assigneeOpen, setAssigneeOpen] = useState(false);
    const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);
    const createTask = useCreateTask(projectId);
    const { data: members = [] } = useProjectMembers(projectId);

    const form = useForm<CreateTaskFormValues>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            title: "",
            description: "",
            status: "todo",
            priority: "medium",
            assigneeId: undefined,
            dueDate: "",
        },
    });

    function onSubmit(data: CreateTaskFormValues) {
        // Include recurrence data if set
        const taskData = {
            ...data,
            ...(recurrenceRule ? {
                recurrenceRule: JSON.stringify(recurrenceRule),
                recurrenceEndDate: recurrenceRule.endDate,
            } : {}),
        };

        createTask.mutate(taskData as any, {
            onSuccess: () => {
                toast.success(recurrenceRule ? "Recurring task created successfully" : "Task created successfully");
                setOpen(false);
                form.reset();
                setRecurrenceRule(null);
            },
            onError: (error) => {
                toast.error(getApiError(error, "create task"));
            },
        });
    }

    const selectedMember = members.find(m => m.userId === form.watch("assigneeId"));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Task</DialogTitle>
                    <DialogDescription>
                        Add a new task to your project.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Task title" {...field} />
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
                                        <Textarea
                                            placeholder="Task description"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Assignee Field */}
                        <FormField
                            control={form.control}
                            name="assigneeId"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Assign to (Optional)</FormLabel>
                                    <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={`w-full justify-start ${!field.value && "text-muted-foreground"}`}
                                                >
                                                    {field.value && selectedMember ? (
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={selectedMember.avatarUrl} />
                                                                <AvatarFallback className="text-xs">
                                                                    {selectedMember.name.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col items-start">
                                                                <span className="text-sm font-medium">{selectedMember.name}</span>
                                                                <span className="text-xs text-muted-foreground">{selectedMember.email}</span>
                                                            </div>
                                                            <X
                                                                className="ml-auto h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    field.onChange(undefined);
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <UserCircle2 className="h-4 w-4" />
                                                            <span>Select team member...</span>
                                                        </div>
                                                    )}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search team members..." />
                                                <CommandList>
                                                    <CommandEmpty>No team member found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {members.filter(m => m.status === 'active').map((member) => (
                                                            <CommandItem
                                                                key={member.userId}
                                                                value={member.name}
                                                                onSelect={() => {
                                                                    field.onChange(member.userId);
                                                                    setAssigneeOpen(false);
                                                                }}
                                                                className="flex items-center gap-2 px-2 py-2"
                                                            >
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={member.avatarUrl} />
                                                                    <AvatarFallback className="text-sm">
                                                                        {member.name.charAt(0)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium">{member.name}</span>
                                                                    <span className="text-xs text-muted-foreground">{member.email}</span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Due Date Field */}
                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Due Date <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="date"
                                                className="pl-10"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="todo">To Do</SelectItem>
                                                <SelectItem value="in-progress">In Progress</SelectItem>
                                                <SelectItem value="done">Done</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Recurrence Section */}
                        <div className="space-y-2">
                            <RecurrenceSelector
                                value={recurrenceRule}
                                onChange={setRecurrenceRule}
                            />
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createTask.isPending}>
                                {createTask.isPending ? "Creating..." : "Create Task"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
