import { useState, useRef, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { cn } from "@/lib/utils";
import { Send, User, Bot, ChevronLeft, ChevronRight, FileText, Settings } from "lucide-react";
import axios from "axios";
import { Save } from "lucide-react";
import { MySQLConfigModal } from "@/pages/MySQLConfigModal";
import { useToast } from "@/components/ui/use-toast";


function formatAsMarkdown(text: string): string {
  return text.replace(/'''([\s\S]*?)'''/g, (_, table) => {
    const lines = table.trim().split("\n");
    if (lines.length < 2) return table;

    const headers = lines[0].split("|").map(h => h.trim());
    const divider = headers.map(() => "---").join(" | ");

    const rows = lines.slice(1).map(row => {
      const parts = row.split("|");
      while (parts.length < headers.length) {
        parts.push("");
      }
      return parts.map(cell => cell.trim()).join(" | ");
    });

    return ["```markdown", headers.join(" | "), divider, ...rows, "```"].join("\n");
  });
}


export default function ChatPage() {
  const {
    isAuthenticated,
    selectedRole,
    uploadedFiles,
    currentChatSession,
    chatSessions,
    addMessage,
    isLoading,
    setIsLoading,
  } = useApp();

  const [message, setMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [currentChatSession?.messages]);

  useEffect(() => {
    if (currentChatSession?.messages.length === 0) {
      generateInitialSummary();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateInitialSummary = async () => {
    if (!uploadedFiles.length) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      uploadedFiles.forEach((file, index) => {
        formData.append(`file${index + 1}`, file.file);
      });

      const response = await axios.post("http://localhost:8001/generate-prompt", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const aiReply = typeof response.data === "string"
        ? response.data
        : response.data?.result || response.data?.response || response.data?.message || "AI did not return a valid response.";

      addMessage(formatAsMarkdown(aiReply), "assistant");
    } catch (error) {
      const errorMsg = axios.isAxiosError(error) && error.response?.data?.detail
        ? error.response.data.detail
        : "Error contacting AI agent.";
      addMessage(`❌ ${errorMsg}`, "assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    addMessage(message, "user");
    setMessage("");
    textareaRef.current?.focus();
    setIsLoading(true);

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file, index) => {
        formData.append(`file${index + 1}`, file.file);
      });
      formData.append("message", message); // Pass the user's question

      const response = await axios.post("http://localhost:8001/generate-prompt", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const aiReply = typeof response.data === "string"
        ? response.data
        : response.data?.result || response.data?.response || response.data?.message || "AI did not return a valid response.";

      addMessage(formatAsMarkdown(aiReply), "assistant");
    } catch (error) {
      const errorMsg = axios.isAxiosError(error) && error.response?.data?.detail
        ? error.response.data.detail
        : "Error contacting AI agent.";
      addMessage(`❌ ${errorMsg}`, "assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!selectedRole) return <Navigate to="/role-selection" replace />;
  if (uploadedFiles.length === 0 || !currentChatSession) return <Navigate to="/file-upload" replace />;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className={cn("bg-card border-r w-72 flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-medium">Chat History</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-grow overflow-y-auto p-2">
          {chatSessions.map((session) => (
            <div key={session.id} className={cn("flex gap-2 items-center p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors", session.id === currentChatSession?.id && "bg-muted")}>
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="flex-grow overflow-hidden">
                <p className="truncate text-sm">{session.title}</p>
                <p className="text-xs text-muted-foreground">{session.messages.length} messages</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium truncate">{selectedRole} Mode</p>
              <p className="text-xs text-muted-foreground">{uploadedFiles.length} files uploaded</p>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-grow flex flex-col overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isSidebarOpen && (
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <h2 className="font-medium">{currentChatSession.title}</h2>
          <Button variant="outline" size="sm" className="ml-2" onClick={() => setIsModalOpen(true)}>
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </div>

      <MySQLConfigModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />


        <div className="flex-grow overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {currentChatSession.messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-lg p-4 whitespace-pre-wrap", msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", msg.sender === "user" ? "bg-primary-foreground/20" : "bg-muted-foreground/20")}>
                      {msg.sender === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                    </div>
                    <p className="text-xs">
                      {msg.sender === "user" ? "You" : "AI Assistant"} • {formatTime(msg.timestamp)}
                    </p>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="max-w-[80%] p-4 shadow-none">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                      <Bot className="h-3 w-3" />
                    </div>
                    <p className="text-xs">AI Assistant • Thinking...</p>
                  </div>
                  <LoadingSkeleton className="h-4 w-3/4 mb-2" />
                  <LoadingSkeleton className="h-4 w-full mb-2" />
                  <LoadingSkeleton className="h-4 w-1/2" />
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-card">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="pr-12 resize-none"
                rows={3}
                disabled={isLoading}
              />
              <Button className="absolute right-2 bottom-2" size="icon" onClick={handleSendMessage} disabled={!message.trim() || isLoading}>
                {isLoading ? <LoadingSpinner size={16} /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              The AI assistant is analyzing your files: {uploadedFiles.map((f) => f.name).join(", ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
