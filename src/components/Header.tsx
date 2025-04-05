
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useApp } from "@/contexts/AppContext";

export function Header() {
  const { isAuthenticated, user, logout } = useApp();

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full etl-gradient flex items-center justify-center">
              <span className="font-bold text-white">ETL</span>
            </div>
            <span className="font-semibold text-lg hidden sm:inline">ETL-Frontend</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {user?.name}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
