
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'Data Analyst' | 'Data Engineer' | 'Business Analyst' | 'ML Engineer' | null;

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  messages: ChatMessage[];
}

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  selectedRole: Role;
  setSelectedRole: (role: Role) => void;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: (files: UploadedFile[]) => void;
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;
  chatSessions: ChatSession[];
  currentChatSession: ChatSession | null;
  createChatSession: () => void;
  addMessage: (content: string, sender: 'user' | 'assistant') => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 11);

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // App state
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Chat state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);

  // Theme toggle function
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
      return newTheme;
    });
  };

  // Apply dark mode class on mount if needed
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  // Auth methods
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email && password) { // Basic validation, will be replaced with real auth
      setUser({
        id: generateId(),
        name: email.split('@')[0],
        email
      });
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (name && email && password) { // Basic validation, will be replaced with real auth
      setUser({
        id: generateId(),
        name,
        email
      });
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setSelectedRole(null);
    setUploadedFiles([]);
    setChatSessions([]);
    setCurrentChatSession(null);
  };

  // File management methods
  const addUploadedFile = (file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file]);
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  // Chat methods
  const createChatSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: `Chat Session ${chatSessions.length + 1}`,
      createdAt: new Date(),
      messages: [
        {
          id: generateId(),
          content: "I've analyzed your uploaded files. Here's a summary...\n\n1. File 1 appears to contain customer transaction data with 1,000+ records.\n2. File 2 contains product inventory information.\n3. File 3 has geographic sales data broken down by region.\n\nWhat specific insights would you like to explore about this data?",
          sender: 'assistant',
          timestamp: new Date()
        }
      ]
    };
    
    setChatSessions(prev => [...prev, newSession]);
    setCurrentChatSession(newSession);
  };

  const addMessage = (content: string, sender: 'user' | 'assistant') => {
    if (!currentChatSession) return;
    
    const newMessage: ChatMessage = {
      id: generateId(),
      content,
      sender,
      timestamp: new Date()
    };
    
    const updatedSession = {
      ...currentChatSession,
      messages: [...currentChatSession.messages, newMessage]
    };
    
    setChatSessions(prev => 
      prev.map(session => 
        session.id === currentChatSession.id ? updatedSession : session
      )
    );
    
    setCurrentChatSession(updatedSession);
  };

  const value = {
    theme,
    toggleTheme,
    isAuthenticated,
    user,
    login,
    signup,
    logout,
    selectedRole,
    setSelectedRole,
    uploadedFiles,
    setUploadedFiles,
    addUploadedFile,
    removeUploadedFile,
    chatSessions,
    currentChatSession,
    createChatSession,
    addMessage,
    isLoading,
    setIsLoading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
