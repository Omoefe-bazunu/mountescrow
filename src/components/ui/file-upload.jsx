"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, File, Image, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileUpload({
  onFilesChange,
  maxFiles = 3,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  className,
  disabled = false,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return `File "${file.name}" exceeds ${(maxSize / (1024 * 1024)).toFixed(
        0
      )}MB limit`;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      return `File "${file.name}" has unsupported format`;
    }

    return null;
  };

  const handleFiles = (files) => {
    if (!files) return;

    setError(null);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const totalFiles = selectedFiles.length + fileArray.length;
    if (totalFiles > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles = [...selectedFiles, ...fileArray].slice(0, maxFiles);
    setSelectedFiles(newFiles);
    onFilesChange(newFiles);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesChange(newFiles);
    setError(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (file.type === "application/pdf")
      return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {selectedFiles.length < maxFiles && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25",
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-primary/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <Input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            disabled={disabled}
          />

          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxFiles} files, {(maxSize / (1024 * 1024)).toFixed(0)}MB
                each. {accept.replace(/\./g, "").toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Selected Files ({selectedFiles.length}/{maxFiles})
          </Label>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={disabled}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
