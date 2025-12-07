import { useState, useRef } from "react";
import { Upload, File, Trash2, Download, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
    useProjectAttachments,
    useUploadProjectAttachment,
    useDeleteProjectAttachment,
} from "../hooks/useProjects";
import type { Attachment } from "../schema";
import { formatDistanceToNow } from "date-fns";

interface ProjectAttachmentsSectionProps {
    projectId: string;
}

function getFileIcon(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    const spreadsheetExts = ['xls', 'xlsx', 'csv'];

    if (imageExts.includes(ext || '')) {
        return '🖼️';
    } else if (docExts.includes(ext || '')) {
        return '📄';
    } else if (spreadsheetExts.includes(ext || '')) {
        return '📊';
    } else if (ext === 'zip' || ext === 'rar' || ext === '7z') {
        return '📦';
    }
    return '📎';
}

export function ProjectAttachmentsSection({ projectId }: ProjectAttachmentsSectionProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: attachments = [], isLoading } = useProjectAttachments(projectId);
    const uploadMutation = useUploadProjectAttachment(projectId);
    const deleteMutation = useDeleteProjectAttachment(projectId);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        await uploadFiles(files);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        await uploadFiles(files);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadFiles = async (files: File[]) => {
        for (const file of files) {
            try {
                await uploadMutation.mutateAsync(file);
                toast.success(`Uploaded ${file.name}`);
            } catch (error) {
                toast.error(`Failed to upload ${file.name}`);
            }
        }
    };

    const handleDelete = async (attachmentId: string, filename: string) => {
        try {
            await deleteMutation.mutateAsync(attachmentId);
            toast.success(`Deleted ${filename}`);
        } catch (error) {
            toast.error(`Failed to delete ${filename}`);
        }
    };

    const handleDownload = (attachment: Attachment) => {
        window.open(attachment.url, '_blank');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Paperclip className="h-5 w-5" />
                            Project Files
                        </CardTitle>
                        <CardDescription>
                            Upload and manage project attachments
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadMutation.isPending}
                    >
                        {uploadMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                        ${isDragging
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                        }
                    `}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                        {isDragging
                            ? 'Drop files here...'
                            : 'Drag and drop files here, or click to browse'
                        }
                    </p>
                </div>

                {/* Attachments List */}
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-14 w-full" />
                        ))}
                    </div>
                ) : attachments.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <File className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No files uploaded yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-2xl">
                                        {getFileIcon(attachment.filename)}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {attachment.filename}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Uploaded {formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDownload(attachment)}
                                        title="Download"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete "{attachment.filename}"?
                                                    This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(attachment.id, attachment.filename)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
