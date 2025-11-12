import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import coatCheckLogo from "@assets/49617362-2EA2-4D26-B4BB-432F691F436A_1762955195555.png";

export default function Landing() {
  const { toast } = useToast();
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const adminLoginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/login/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOAuthLogin = () => {
    window.location.href = "/api/login";
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    adminLoginMutation.mutate({ username: adminUsername, password: adminPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img 
              src={coatCheckLogo} 
              alt="Coat Check" 
              className="h-32 w-auto"
              data-testid="img-logo"
            />
          </div>
          <CardDescription className="text-base">
            Coating Shop Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OAuth Login */}
          <div className="space-y-3">
            <Button
              onClick={handleOAuthLogin}
              className="w-full"
              size="lg"
              data-testid="button-oauth-login"
            >
              Sign in with Replit
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Login with Google, GitHub, Apple, or Email via Replit Auth
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          {/* Local Admin Login (Collapsible) */}
          <Collapsible open={showAdminLogin} onOpenChange={setShowAdminLogin}>
            <CollapsibleTrigger className="w-full" data-testid="button-toggle-admin-login">
              <Button
                variant="outline"
                className="w-full"
                type="button"
              >
                <span>Admin Emergency Access</span>
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showAdminLogin ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">Username</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    required
                    data-testid="input-admin-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                    data-testid="input-admin-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={adminLoginMutation.isPending}
                  data-testid="button-admin-login"
                >
                  {adminLoginMutation.isPending ? "Logging in..." : "Login as Admin"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Emergency backdoor for administrators when OAuth is unavailable
              </p>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}
