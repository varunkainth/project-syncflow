import { useState } from "react";
import { Tag, Plus, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    useProjectLabels,
    useTaskLabels,
    useCreateLabel,
    useSetTaskLabels,
    LABEL_COLORS,
} from "../hooks/useLabels";
import { getApiError } from "@/utils/errorHandler";

interface LabelSelectorProps {
    projectId: string;
    taskId: string;
}

export function LabelSelector({ projectId, taskId }: LabelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newLabelName, setNewLabelName] = useState("");
    const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].value);

    const { data: projectLabels = [] } = useProjectLabels(projectId);
    const { data: taskLabels = [], isLoading: loadingTaskLabels } = useTaskLabels(taskId);
    const createLabelMutation = useCreateLabel(projectId);
    const setTaskLabelsMutation = useSetTaskLabels(taskId);

    const taskLabelIds = taskLabels.map((l) => l.id);

    const handleToggleLabel = async (labelId: string) => {
        const isSelected = taskLabelIds.includes(labelId);
        const newLabelIds = isSelected
            ? taskLabelIds.filter((id) => id !== labelId)
            : [...taskLabelIds, labelId];

        try {
            await setTaskLabelsMutation.mutateAsync(newLabelIds);
        } catch (error) {
            toast.error(getApiError(error, "update labels"));
        }
    };

    const handleCreateLabel = async () => {
        if (!newLabelName.trim()) return;

        try {
            const label = await createLabelMutation.mutateAsync({
                name: newLabelName.trim(),
                color: selectedColor,
            });
            // Also assign to task
            await setTaskLabelsMutation.mutateAsync([...taskLabelIds, label.id]);
            setNewLabelName("");
            setIsCreating(false);
            toast.success("Label created");
        } catch (error) {
            toast.error(getApiError(error, "create label"));
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4" />
                    Labels
                </div>
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7">
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="end">
                        {isCreating ? (
                            <div className="p-3 space-y-3">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Label name"
                                        value={newLabelName}
                                        onChange={(e) => setNewLabelName(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex flex-wrap gap-1">
                                        {LABEL_COLORS.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                className={`w-6 h-6 rounded-full transition-transform ${selectedColor === color.value ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                                                    }`}
                                                style={{ backgroundColor: color.value }}
                                                onClick={() => setSelectedColor(color.value)}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setIsCreating(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={handleCreateLabel}
                                        disabled={!newLabelName.trim() || createLabelMutation.isPending}
                                    >
                                        {createLabelMutation.isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            "Create"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Command>
                                <CommandInput placeholder="Search labels..." />
                                <CommandList>
                                    <CommandEmpty>
                                        <p className="text-sm text-muted-foreground">No labels found.</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => setIsCreating(true)}
                                        >
                                            Create new label
                                        </Button>
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {projectLabels.map((label) => {
                                            const isSelected = taskLabelIds.includes(label.id);
                                            return (
                                                <CommandItem
                                                    key={label.id}
                                                    value={label.name}
                                                    onSelect={() => handleToggleLabel(label.id)}
                                                >
                                                    <div className="flex items-center gap-2 w-full">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: label.color }}
                                                        />
                                                        <span className="flex-1">{label.name}</span>
                                                        {isSelected && <Check className="h-4 w-4" />}
                                                    </div>
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </CommandList>
                                <div className="p-2 border-t">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => setIsCreating(true)}
                                    >
                                        <Plus className="h-3 w-3 mr-2" />
                                        Create new label
                                    </Button>
                                </div>
                            </Command>
                        )}
                    </PopoverContent>
                </Popover>
            </div>

            {/* Display assigned labels */}
            {loadingTaskLabels ? (
                <div className="flex gap-1">
                    <div className="h-5 w-12 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                </div>
            ) : taskLabels.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                    {taskLabels.map((label) => (
                        <Badge
                            key={label.id}
                            variant="outline"
                            className="text-xs flex items-center gap-1"
                            style={{
                                borderColor: label.color,
                                backgroundColor: `${label.color}20`,
                            }}
                        >
                            <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: label.color }}
                            />
                            {label.name}
                            <button
                                onClick={() => handleToggleLabel(label.id)}
                                className="ml-0.5 hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-muted-foreground">No labels assigned</p>
            )}
        </div>
    );
}
