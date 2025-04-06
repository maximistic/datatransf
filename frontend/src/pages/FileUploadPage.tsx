import React, { useState, useRef, ChangeEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { FileText, X, Upload, AlertCircle } from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

export default function FileUploadPage() {
  const {
    isAuthenticated,
    selectedRole,
    addUploadedFile,
    uploadedFiles,
    removeUploadedFile,
    createChatSession,
    isLoading,
    setIsLoading,
  } = useApp();

  const { toast } = useToast();
  const navigate = useNavigate();

  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!selectedRole) return <Navigate to="/role-selection" replace />;

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    setError(null);
    const files = e.target.files;
    if (!files || !files[0]) return;

    const file = files[0];

    if (uploadedFiles.length >= 3) {
      setError("All 3 file slots are already occupied.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds the 10MB size limit");
      return;
    }

    const fileObj: UploadedFile = {
      id: Math.random().toString(36).substring(2, 11),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    };

    addUploadedFile(fileObj);
    if (fileInputRefs[index].current) {
      fileInputRefs[index].current.value = "";
    }
  };

  const handleRemoveFile = (id: string) => {
    removeUploadedFile(id);
    setUploadProgress((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const uploadFilesToBackend = async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file, idx) => {
      formData.append(`file${idx + 1}`, file);
    });

    try {
      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload files: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error("Upload error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError("Error uploading files to backend: " + errorMessage);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      setError("Please upload at least one file");
      return;
    }

    setIsLoading(true);

    const files = uploadedFiles.map((fileObj) => fileObj.file);
    const result = await uploadFilesToBackend(files);

    if (result) {
      toast({ title: "Files uploaded", description: "Redirecting to chat..." });
      createChatSession();
      navigate("/chat");
    }

    setIsLoading(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="container max-w-6xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Upload Files</h1>
        <p className="text-muted-foreground">Upload up to 3 files</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
          <CardDescription>
            Role: <span className="font-medium text-primary">{selectedRole}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((index) => {
              const file = uploadedFiles[index];
              return (
                <div key={index} className="space-y-4">
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50"
                    onClick={() => fileInputRefs[index].current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRefs[index]}
                      onChange={(e) => handleFileSelect(e, index)}
                      className="hidden"
                      disabled={!!file}
                    />
                    {file ? (
                      <div className="flex flex-col items-center gap-2 w-full">
                        <div className="bg-background rounded p-2">
                          <FileText className="h-5 w-5" />
                        </div>
                        <p className="font-medium truncate w-full px-2">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        <Progress value={uploadProgress[file.id] || 100} className="h-1 w-full mt-2" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <h3 className="font-medium">File {index + 1}</h3>
                        <p className="text-sm text-muted-foreground">Click to upload</p>
                      </div>
                    )}
                  </div>
                  {file && (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleRemoveFile(file.id)}>
                      <X className="h-4 w-4 mr-2" />
                      Remove File {index + 1}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/role-selection")} disabled={isLoading}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={uploadedFiles.length === 0 || isLoading}>
            {isLoading && <LoadingSpinner size={16} className="mr-2" />}
            Process Files
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}