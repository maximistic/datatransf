
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";
import AuthPage from "@/pages/AuthPage";
import RoleSelectionPage from "@/pages/RoleSelectionPage";
import FileUploadPage from "@/pages/FileUploadPage";
import ChatPage from "@/pages/ChatPage";
import NotFoundPage from "@/pages/NotFoundPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<AuthPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/role-selection" element={<RoleSelectionPage />} />
              <Route path="/file-upload" element={<FileUploadPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
