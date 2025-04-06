
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Brain, Database, LineChart, Workflow } from "lucide-react";

const roles = [
  {
    id: "System Integrator",
    title: "System Integrator",
    description: "Integrate and coordinate complex systems to work together seamlessly",
    icon: LineChart,
    value: "System Integrator" as const,
  },
  {
    id: "data-engineer",
    title: "Data Engineer",
    description: "Build and optimize data pipelines and infrastructure",
    icon: Database,
    value: "Data Engineer" as const,
  },
  {
    id: "business-analyst",
    title: "Business Analyst",
    description: "Translate data insights into business recommendations",
    icon: Workflow,
    value: "Business Analyst" as const,
  },
  {
    id: "Data Analyst",
    title: "Data Analyst",
    description: "Focus on analyzing and interpreting complex data sets",
    icon: Brain,
    value: "Data Analyst" as const,
  },
];

export default function RoleSelectionPage() {
  const { isAuthenticated, selectedRole, setSelectedRole, isLoading, setIsLoading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading state for skeleton
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [setIsLoading]);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to file upload if role is already selected
  if (selectedRole) {
    return <Navigate to="/file-upload" replace />;
  }

  const handleRoleSelection = (role: typeof roles[0]["value"]) => {
    setIsLoading(true);
    setTimeout(() => {
      setSelectedRole(role);
      setIsLoading(false);
      navigate("/file-upload");
    }, 500);
  };

  return (
    <div className="container max-w-4xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Select Your Role</h1>
        <p className="text-muted-foreground">
          Choose a role to customize your ETL experience
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="h-[220px] flex flex-col">
                <CardHeader className="pb-2">
                  <LoadingSkeleton className="h-6 w-28 mb-2" />
                  <LoadingSkeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="flex-grow">
                  <LoadingSkeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                  <LoadingSkeleton className="h-4 w-3/4 mx-auto" />
                </CardContent>
                <CardFooter>
                  <LoadingSkeleton className="h-10 w-full rounded-md" />
                </CardFooter>
              </Card>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>{role.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <role.icon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-center text-muted-foreground">
                  {role.description}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleRoleSelection(role.value)}
                >
                  Select {role.title}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-12 border border-dashed rounded-lg p-6 bg-muted/50">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-secondary/20 p-3 rounded-full">
            <Brain className="h-6 w-6 text-secondary" />
          </div>
          <div className="flex-grow text-center sm:text-left">
            <h3 className="font-medium mb-1">Let AI Decide Your Role</h3>
            <p className="text-sm text-muted-foreground">
              Not sure which role fits you best? Let our AI analyze your needs and suggest the optimal role.
            </p>
          </div>
          <Button variant="outline" className="whitespace-nowrap" disabled>
            Coming Soon
          </Button>
        </div>
      </div>
    </div>
  );
}
