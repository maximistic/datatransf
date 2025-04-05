
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useApp();

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme} 
      className="rounded-full"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-gray-700" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-300" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
