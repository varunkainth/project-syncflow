import { useState } from "react";
import { Repeat } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

export type RecurrencePattern = "none" | "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

export interface RecurrenceValue {
    pattern: RecurrencePattern;
    interval: number;
    endDate?: Date;
}

interface RecurrenceSelectorProps {
    value?: RecurrenceValue;
    onChange: (value: RecurrenceValue | undefined) => void;
}

const PATTERN_OPTIONS = [
    { value: "none", label: "No recurrence" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Every 2 weeks" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
];

export function RecurrenceSelector({ value, onChange }: RecurrenceSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [pattern, setPattern] = useState<RecurrencePattern>(value?.pattern || "none");
    const [interval, setInterval] = useState(value?.interval || 1);
    const [hasEndDate, setHasEndDate] = useState(!!value?.endDate);
    const [endDate, setEndDate] = useState<Date | undefined>(value?.endDate);

    const handlePatternChange = (newPattern: RecurrencePattern) => {
        setPattern(newPattern);
        if (newPattern === "none") {
            onChange(undefined);
        } else {
            onChange({
                pattern: newPattern,
                interval,
                endDate: hasEndDate ? endDate : undefined,
            });
        }
    };

    const handleIntervalChange = (newInterval: number) => {
        setInterval(newInterval);
        if (pattern !== "none") {
            onChange({
                pattern,
                interval: newInterval,
                endDate: hasEndDate ? endDate : undefined,
            });
        }
    };

    const handleEndDateToggle = (enabled: boolean) => {
        setHasEndDate(enabled);
        if (pattern !== "none") {
            onChange({
                pattern,
                interval,
                endDate: enabled ? endDate : undefined,
            });
        }
    };

    const handleEndDateChange = (date: Date | undefined) => {
        setEndDate(date);
        if (pattern !== "none" && hasEndDate) {
            onChange({
                pattern,
                interval,
                endDate: date,
            });
        }
    };

    const getPatternLabel = () => {
        if (pattern === "none") return "No recurrence";
        const patternLabel = PATTERN_OPTIONS.find((p) => p.value === pattern)?.label || pattern;
        if (interval > 1 && pattern !== "biweekly") {
            return `Every ${interval} ${pattern === "daily" ? "days" : pattern === "weekly" ? "weeks" : pattern === "monthly" ? "months" : "times"}`;
        }
        return patternLabel;
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                >
                    <Repeat className="mr-2 h-4 w-4" />
                    {getPatternLabel()}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 sm:w-80" align="start">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Repeat</Label>
                        <Select value={pattern} onValueChange={(v) => handlePatternChange(v as RecurrencePattern)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PATTERN_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {pattern !== "none" && pattern !== "biweekly" && (
                        <div className="space-y-2">
                            <Label>Every</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={interval}
                                    onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                                    className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">
                                    {pattern === "daily" ? "day(s)" : pattern === "weekly" ? "week(s)" : pattern === "monthly" ? "month(s)" : "time(s)"}
                                </span>
                            </div>
                        </div>
                    )}

                    {pattern !== "none" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="has-end-date">End date</Label>
                                <Switch
                                    id="has-end-date"
                                    checked={hasEndDate}
                                    onCheckedChange={handleEndDateToggle}
                                />
                            </div>
                            {hasEndDate && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, "PPP") : "Pick end date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={handleEndDateChange}
                                            disabled={(date) => date < new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
