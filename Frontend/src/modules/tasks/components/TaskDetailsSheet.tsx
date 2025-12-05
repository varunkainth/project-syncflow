import { useState, useEffect } from "react";
import { formatDistanceToNow, format, isPast, isWithinInterval, addDays } from "date-fns";
import { Trash2, Send, Loader2, MessageSquare, Edit2, Calendar, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useTask, useUpdateTask, useDeleteTask, useAddComment, useUpdateComment, useDeleteComment } from "../hooks/useTasks";
import { useUser } from "../../auth/hooks/useUser";
import { useProjectMembers, useCurrentUserRole } from "../../projects/hooks/useProjects";
import type { Comment } from "../schema";

interface TaskDetailsSheetProps {
    taskId: string | null;
    projectId: string;
    onClose: () => void;
}

interface CommentNode extends Comment {
    children: CommentNode[];
}

function CommentItem({ comment, projectId, currentUserId }: { comment: CommentNode, projectId: string, currentUserId?: string }) {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [editContent, setEditContent] = useState(comment.content);

    const updateComment = useUpdateComment(projectId);
    const deleteComment = useDeleteComment(projectId);
    const addComment = useAddComment(projectId);

    const canEdit = currentUserId === comment.userId && (Date.now() - new Date(comment.createdAt).getTime() < 2 * 60 * 1000);
    const canDelete = currentUserId === comment.userId;

    const handleReply = () => {
        if (!replyContent.trim()) return;
        addComment.mutate({ taskId: comment.taskId, content: replyContent, parentId: comment.id }, {
            onSuccess: () => {
                setReplyContent("");
                setIsReplying(false);
                toast.success("Reply added");
            },
            onError: () => toast.error("Failed to add reply"),
        });
    };

    const handleEdit = () => {
        if (!editContent.trim() || editContent === comment.content) {
            setIsEditing(false);
            return;
        }
        updateComment.mutate({ commentId: comment.id, content: editContent }, {
            onSuccess: () => {
                setIsEditing(false);
                toast.success("Comment updated");
            },
            onError: () => toast.error("Failed to update comment"),
        });
    };

    const handleDelete = () => {
        if (confirm("Delete this comment?")) {
            deleteComment.mutate({ commentId: comment.id, taskId: comment.taskId }, {
                onSuccess: () => toast.success("Comment deleted"),
                onError: () => toast.error("Failed to delete comment"),
            });
        }
    };

    return (
        <div className="flex gap-3 group">
            <Avatar className="h-9 w-9 mt-0.5 shrink-0 ring-2 ring-background">
                <AvatarImage src={comment.user.avatarUrl} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10">{comment.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-foreground">{comment.user.name}</span>
                    <span className="text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                </div>

                {isEditing ? (
                    <div className="space-y-2">
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px] bg-background border-primary/30 focus:border-primary"
                        />
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleEdit} disabled={updateComment.isPending}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-muted/40 hover:bg-muted/60 transition-colors p-3 rounded-xl text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {comment.content}
                    </div>
                )}

                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
                        onClick={() => setIsReplying(!isReplying)}
                    >
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Reply
                    </Button>
                    {canEdit && !isEditing && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
                            onClick={() => setIsEditing(true)}
                        >
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                        </Button>
                    )}
                </div>

                {isReplying && (
                    <div className="mt-3 flex gap-2 items-center">
                        <Input
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleReply();
                                }
                            }}
                            className="flex-1 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 rounded-full px-4"
                        />
                        <Button size="icon" className="rounded-full h-9 w-9" onClick={handleReply} disabled={addComment.isPending || !replyContent.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {comment.children.length > 0 && (
                    <div className="mt-4 space-y-4 pl-4 border-l-2 border-primary/20 hover:border-primary/40 transition-colors">
                        {comment.children.map(child => (
                            <CommentItem key={child.id} comment={child} projectId={projectId} currentUserId={currentUserId} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export function TaskDetailsSheet({ taskId, projectId, onClose }: TaskDetailsSheetProps) {
    const { data: user } = useUser();
    const { data: task, isLoading } = useTask(taskId || "");
    const updateTask = useUpdateTask(projectId);
    const deleteTask = useDeleteTask(projectId);
    const addComment = useAddComment(projectId);
    const { data: members = [] } = useProjectMembers(projectId);
    const { canEditTasks } = useCurrentUserRole(projectId, user?.id);
    const [comment, setComment] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Update local state when task changes
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
        }
    }, [task?.id, task?.title, task?.description]);

    if (!taskId) return null;

    const isCreator = task?.creatorId === user?.id;
    const isAssignee = task?.assigneeId === user?.id;
    const canEdit = isCreator || canEditTasks;
    const canChangeStatus = canEdit || isAssignee;

    const handleUpdate = (field: "title" | "description", value: string) => {
        if (!task || !canEdit) return;
        if (task[field] === value) return; // No change
        updateTask.mutate({ id: task.id, data: { [field]: value } }, {
            onSuccess: () => toast.success(`${field === "title" ? "Title" : "Description"} updated`),
            onError: () => toast.error(`Failed to update ${field}`),
        });
    };

    const handleStatusChange = (value: string) => {
        if (!task || !canEdit) return;
        updateTask.mutate({ id: task.id, data: { status: value as any } }, {
            onSuccess: () => toast.success("Status updated"),
            onError: () => toast.error("Failed to update status"),
        });
    };

    const handleDelete = () => {
        if (!task) return;
        deleteTask.mutate(task.id, {
            onSuccess: () => {
                toast.success("Task deleted");
                onClose();
            },
            onError: () => toast.error("Failed to delete task"),
        });
    };

    const handleAddComment = () => {
        if (!task || !comment.trim()) return;
        addComment.mutate({ taskId: task.id, content: comment }, {
            onSuccess: () => {
                setComment("");
                toast.success("Comment added");
            },
            onError: () => toast.error("Failed to add comment"),
        });
    };

    const buildCommentTree = (comments: Comment[]) => {
        const map = new Map<string, CommentNode>();
        const roots: CommentNode[] = [];

        // First pass: create nodes
        comments.forEach(c => {
            map.set(c.id, { ...c, children: [] });
        });

        // Second pass: link children
        comments.forEach(c => {
            const node = map.get(c.id)!;
            if (c.parentId && map.get(c.parentId)) {
                map.get(c.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        // Sort by createdAt (oldest first usually for comments, or newest first)
        // Let's do newest first for roots, and oldest first for replies?
        // Usually comments are newest first.
        roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Sort children (replies usually oldest first to read conversation)
        const sortChildren = (nodes: CommentNode[]) => {
            nodes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            nodes.forEach(n => sortChildren(n.children));
        };
        roots.forEach(r => sortChildren(r.children));

        return roots;
    };

    const commentTree = task?.comments ? buildCommentTree(task.comments) : [];

    return (
        <Dialog open={!!taskId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogTitle className="sr-only">Task Details</DialogTitle>
                <DialogDescription className="sr-only">View and manage task details, comments, and status.</DialogDescription>
                {isLoading || !task ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {/* Header Section */}
                        <div className="p-6 border-b bg-gradient-to-r from-background to-muted/30">
                            {/* Title Row */}
                            <div className="mb-3">
                                <Input
                                    value={title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleUpdate("title", e.target.value)}
                                    disabled={!canEdit}
                                    className="text-3xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent text-foreground tracking-tight"
                                />
                            </div>

                            {/* Description directly below title */}
                            <div className="mb-5">
                                <Textarea
                                    value={description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                    onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => handleUpdate("description", e.target.value)}
                                    disabled={!canEdit}
                                    className="min-h-[60px] resize-none border-none shadow-none focus-visible:ring-0 p-0 text-muted-foreground bg-transparent text-base leading-relaxed"
                                    placeholder={canEdit ? "Add a description..." : "No description provided."}
                                />
                            </div>

                            {/* Meta Info Row - Status, Due Date, Assignee */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Status Badge */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</span>
                                    <Select value={task.status} onValueChange={handleStatusChange} disabled={!canChangeStatus}>
                                        <SelectTrigger className={`w-[130px] h-8 border-0 ${task.status === 'todo' ? 'bg-slate-500/20 text-slate-600 dark:text-slate-300' :
                                            task.status === 'in-progress' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300' :
                                                'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                            } font-medium rounded-full`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todo">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                                                    To Do
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="in-progress">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    In Progress
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="done">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    Done
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-px h-6 bg-border" />

                                {/* Due Date */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due</span>
                                    {task.dueDate ? (
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${task.status === 'done'
                                            ? 'bg-muted text-muted-foreground'
                                            : isPast(new Date(task.dueDate))
                                                ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                                                : isWithinInterval(new Date(task.dueDate), { start: new Date(), end: addDays(new Date(), 3) })
                                                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                                    : 'bg-muted text-foreground'
                                            }`}>
                                            {isPast(new Date(task.dueDate)) && task.status !== 'done' ? (
                                                <AlertCircle className="h-3.5 w-3.5" />
                                            ) : (
                                                <Calendar className="h-3.5 w-3.5" />
                                            )}
                                            <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Not set</span>
                                    )}
                                </div>

                                <div className="w-px h-6 bg-border" />

                                {/* Assignee */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assignee</span>
                                    {canEdit ? (
                                        <Select
                                            value={task.assigneeId || "unassigned"}
                                            onValueChange={(value) => {
                                                const newAssigneeId = value === "unassigned" ? undefined : value;
                                                updateTask.mutate(
                                                    { id: task.id, data: { assigneeId: newAssigneeId } },
                                                    {
                                                        onSuccess: () => toast.success("Assignee updated"),
                                                        onError: () => toast.error("Failed to update assignee"),
                                                    }
                                                );
                                            }}
                                        >
                                            <SelectTrigger className="w-[180px] h-8 border rounded-full bg-muted/50">
                                                <div className="flex items-center gap-2">
                                                    {task.assignee ? (
                                                        <>
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={task.assignee.avatarUrl} />
                                                                <AvatarFallback className="text-xs">{task.assignee.name?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="truncate font-medium">{task.assignee.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-muted-foreground">Unassigned</span>
                                                        </>
                                                    )}
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        Unassigned
                                                    </div>
                                                </SelectItem>
                                                {members.filter(m => m.status === 'active').map((member) => (
                                                    <SelectItem key={member.userId} value={member.userId}>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={member.avatarUrl} />
                                                                <AvatarFallback className="text-xs">{member.name?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <span>{member.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : task.assignee ? (
                                        <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-full">
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={task.assignee.avatarUrl} />
                                                <AvatarFallback className="text-xs">{task.assignee.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{task.assignee.name}</span>
                                        </div>
                                    ) : (<span className="text-sm text-muted-foreground">Unassigned</span>
                                    )}
                                </div>

                                <div className="w-px h-6 bg-border" />

                                {/* Creator */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created by</span>
                                    {task.creator ? (
                                        <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-full">
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={task.creator.avatarUrl} />
                                                <AvatarFallback className="text-xs">{task.creator.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{task.creator.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Unknown</span>
                                    )}
                                </div>

                                {/* Delete Button - rightmost */}
                                {canEdit && (
                                    <>
                                        <div className="flex-1" />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                                            onClick={handleDelete}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            <ScrollArea className="flex-1">
                                <div className="p-6">
                                    {/* Comments Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                            <h4 className="text-sm font-semibold text-foreground">Comments</h4>
                                            {commentTree.length > 0 && (
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                    {commentTree.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            {commentTree.length > 0 ? (
                                                commentTree.map((comment) => (
                                                    <CommentItem key={comment.id} comment={comment} projectId={projectId} currentUserId={user?.id} />
                                                ))
                                            ) : (
                                                <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                                                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                                                    <p className="text-muted-foreground text-sm">No comments yet</p>
                                                    <p className="text-muted-foreground/70 text-xs mt-1">Be the first to start the conversation!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="p-4 border-t bg-gradient-to-r from-background to-muted/20">
                            <div className="flex gap-3 items-center">
                                <Avatar className="h-9 w-9 ring-2 ring-background shrink-0">
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex gap-2 items-center">
                                    <Input
                                        placeholder="Write a comment..."
                                        value={comment}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddComment();
                                            }
                                        }}
                                        className="flex-1 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 rounded-full px-4"
                                    />
                                    <Button
                                        size="icon"
                                        className="rounded-full h-9 w-9 shrink-0"
                                        onClick={handleAddComment}
                                        disabled={addComment.isPending || !comment.trim()}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
