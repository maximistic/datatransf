
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

export default function FileUploadPage() {
  const { 
    isAuthenticated, 
    selectedRole, 
    uploadedFiles, 
    addUploadedFile, 
    removeUploadedFile,
    createChatSession,
    isLoading,
    setIsLoading
  } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to role selection if role not selected
  if (!selectedRole) {
    return <Navigate to="/role-selection" replace />;
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files) return;

    // Check if adding these files would exceed the 3 file limit
    if (uploadedFiles.length + files.length > 3) {
      setError("You can only upload a maximum of 3 files");
      return;
    }

    Array.from(files).forEach((file) => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError("One or more files exceed the 10MB size limit");
        return;
      }

      // Check for duplicate files
      if (uploadedFiles.some(f => f.name === file.name)) {
        setError(`File "${file.name}" has already been added`);
        return;
      }

      // Create file object with id
      const fileObj = {
        id: Math.random().toString(36).substring(2, 11),
        name: file.name,
        size: file.size,
        type: file.type
      };

      // Simulate upload progress
      simulateFileUpload(fileObj.id, () => {
        addUploadedFile(fileObj);
      });
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const simulateFileUpload = (fileId: string, onComplete: () => void) => {
    let progress = 0;
    setUploadProgress(prev => ({ ...prev, [fileId]: progress }));

    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
        onComplete();
      } else {
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      }
    }, 200);
  };

  const handleRemoveFile = (id: string) => {
    removeUploadedFile(id);
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[id];
      return newProgress;
    });
  };

  const handleSubmit = () => {
    if (uploadedFiles.length === 0) {
      setError("Please upload at least one file");
      return;
    }

    setIsLoading(true);
    
    // Simulate processing files
    setTimeout(() => {
      createChatSession();
      setIsLoading(false);
      toast({
        title: "Files uploaded successfully",
        description: "Redirecting to chat interface...",
      });
      navigate("/chat");
    }, 1500);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    // For demo, we just use a generic file icon
    return <FileText className="h-5 w-5" />;
  };

  return (
    <div className="container max-w-3xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Upload Files</h1>
        <p className="text-muted-foreground">
          Upload up to 3 files to analyze
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
          <CardDescription>
            Currently working as: <span className="font-medium text-primary">{selectedRole}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="font-medium">Click to upload files</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supported file types: CSV, XLSX, JSON, TXT, PDF (Max 10MB per file)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Uploaded Files ({uploadedFiles.length}/3)</h3>
            </div>

            {uploadedFiles.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No files uploaded yet
              </div>
            ) : (
              <ul className="space-y-3">
                {uploadedFiles.map((file) => (
                  <li 
                    key={file.id}
                    className="flex items-center bg-muted/30 rounded-md p-3"
                  >
                    <div className="bg-background rounded p-2 mr-3">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground ml-2">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Progress 
                        value={uploadProgress[file.id] || 100} 
                        className="h-1 mt-2" 
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate("/role-selection")}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={uploadedFiles.length === 0 || isLoading}
          >
            {isLoading ? <LoadingSpinner size={16} className="mr-2" /> : null}
            Process Files
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
