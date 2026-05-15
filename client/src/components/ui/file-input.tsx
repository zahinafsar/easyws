"use client";
import { InputHTMLAttributes, ReactNode, useCallback, useEffect, useState } from "react";
import { FileIcon, XIcon } from "lucide-react";
import { cn } from "../../lib/cn";

type FileInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value?: File[];
  onValueChange?: (files: File[]) => void;
  children?: ReactNode;
  maxSize?: number;
};

export function FileInput({
  value,
  onValueChange,
  children,
  multiple,
  accept,
  disabled,
  className,
  maxSize,
  ...p
}: FileInputProps) {
  const [internal, setInternal] = useState<File[]>([]);
  const files = value ?? internal;
  const [dragOver, setDragOver] = useState(false);

  const commit = useCallback(
    (next: File[]) => {
      const filtered = maxSize ? next.filter((f) => f.size <= maxSize) : next;
      if (value === undefined) setInternal(filtered);
      onValueChange?.(filtered);
    },
    [value, onValueChange, maxSize]
  );

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    commit(multiple ? [...files, ...incoming] : incoming.slice(0, 1));
  };

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled) return;
        addFiles(e.dataTransfer.files);
      }}
      data-drag-over={dragOver || undefined}
      data-disabled={disabled || undefined}
      className={cn("group relative inline-flex cursor-pointer", disabled && "pointer-events-none opacity-50", className)}
    >
      <input
        type="file"
        className="sr-only"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        onChange={(e) => addFiles(e.target.files)}
        {...p}
      />
      {children}
    </label>
  );
}

type FilePreviewProps = {
  files: File[];
  onRemove?: (index: number) => void;
  className?: string;
};

export function FilePreview({ files, onRemove, className }: FilePreviewProps) {
  if (files.length === 0) return null;
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {files.map((f, i) => (
        <FilePreviewItem key={`${f.name}-${i}`} file={f} onRemove={onRemove ? () => onRemove(i) : undefined} />
      ))}
    </ul>
  );
}

function FilePreviewItem({ file, onRemove }: { file: File; onRemove?: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, isImage]);

  return (
    <li className="flex items-center gap-3 rounded-md border border-border bg-background p-2 text-sm">
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
        {isImage && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={file.name} className="size-full object-cover" />
        ) : (
          <FileIcon className="size-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{file.name}</div>
        <div className="text-xs text-muted-foreground">{formatSize(file.size)}</div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={`Remove ${file.name}`}
        >
          <XIcon className="size-4" />
        </button>
      )}
    </li>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
