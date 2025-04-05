
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { isAuthenticated, login, signup, isLoading } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  // Form validation errors
  const [loginErrors, setLoginErrors] = useState({ email: "", password: "" });
  const [signupErrors, setSignupErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // If already authenticated, redirect to role selection
  if (isAuthenticated) {
    return <Navigate to="/role-selection" replace />;
  }

  // Login form validation
  const validateLoginForm = (): boolean => {
    const errors = { email: "", password: "" };
    let isValid = true;

    if (!loginEmail) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(loginEmail)) {
      errors.email = "Email is invalid";
      isValid = false;
    }

    if (!loginPassword) {
      errors.password = "Password is required";
      isValid = false;
    }

    setLoginErrors(errors);
    return isValid;
  };

  // Signup form validation
  const validateSignupForm = (): boolean => {
    const errors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    let isValid = true;

    if (!signupName) {
      errors.name = "Name is required";
      isValid = false;
    }

    if (!signupEmail) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(signupEmail)) {
      errors.email = "Email is invalid";
      isValid = false;
    }

    if (!signupPassword) {
      errors.password = "Password is required";
      isValid = false;
    } else if (signupPassword.length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (signupPassword !== signupConfirmPassword) {
      errors.confirmPassword = "Passwords don't match";
      isValid = false;
    }

    setSignupErrors(errors);
    return isValid;
  };

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    const success = await login(loginEmail, loginPassword);
    if (success) {
      toast({
        title: "Login successful",
        description: "You are now logged in",
      });
    } else {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  // Handle signup form submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    const success = await signup(signupName, signupEmail, signupPassword);
    if (success) {
      toast({
        title: "Account created",
        description: "Your account has been created successfully",
      });
    } else {
      toast({
        title: "Signup failed",
        description: "Error creating account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">ETL Frontend</h1>
          <p className="text-muted-foreground mt-2">
            Login or create an account to get started
          </p>
        </div>

        <Tabs
          defaultValue="login"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="animate-slide-in">
            <Card>
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className={loginErrors.email ? "border-destructive" : ""}
                    />
                    {loginErrors.email && (
                      <p className="text-destructive text-sm">{loginErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Button variant="link" size="sm" className="p-0 h-auto">
                        Forgot password?
                      </Button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={loginErrors.password ? "border-destructive" : ""}
                    />
                    {loginErrors.password && (
                      <p className="text-destructive text-sm">
                        {loginErrors.password}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size={16} className="mr-2" /> : null}
                    Login
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup" className="animate-slide-in">
            <Card>
              <form onSubmit={handleSignup}>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Fill in your details to create a new account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className={signupErrors.name ? "border-destructive" : ""}
                    />
                    {signupErrors.name && (
                      <p className="text-destructive text-sm">{signupErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className={signupErrors.email ? "border-destructive" : ""}
                    />
                    {signupErrors.email && (
                      <p className="text-destructive text-sm">{signupErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className={signupErrors.password ? "border-destructive" : ""}
                    />
                    {signupErrors.password && (
                      <p className="text-destructive text-sm">
                        {signupErrors.password}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className={
                        signupErrors.confirmPassword ? "border-destructive" : ""
                      }
                    />
                    {signupErrors.confirmPassword && (
                      <p className="text-destructive text-sm">
                        {signupErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size={16} className="mr-2" /> : null}
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {activeTab === "login" ? (
            <p>
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => setActiveTab("signup")}
              >
                Sign up
              </Button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => setActiveTab("login")}
              >
                Login
              </Button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
