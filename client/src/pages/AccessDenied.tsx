import { ShieldOff } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldOff className="h-8 w-8 text-destructive" data-testid="icon-access-denied" />
          </div>
          <CardTitle data-testid="heading-access-denied">Access Denied</CardTitle>
          <CardDescription data-testid="text-access-denied-message">
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Link href="/estimates">
            <Button className="w-full" data-testid="button-go-estimates">
              Go to Estimates
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline" className="w-full" data-testid="button-go-profile">
              Go to Profile
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
