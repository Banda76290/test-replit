import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSSOLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      await login({ email: "developer@oasis.internal" });
    } catch (err) {
      setError("Échec de l'authentification. Veuillez réessayer ou contacter le support IT.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
      <div className="w-full max-w-md animate-slide-up z-10">
        <div className="flex flex-col items-center mb-8">
          <Logo className="scale-125 mb-4" />
          <p className="text-muted-foreground tracking-wide uppercase text-sm font-medium">Solutions Digitales</p>
        </div>

        <Card className="border-none shadow-xl shadow-black/5 bg-card/90 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2 pb-6 border-b border-border/50">
            <CardTitle className="text-2xl">Portail Entreprise</CardTitle>
            <CardDescription>Accès interne</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-8 flex flex-col items-center">
            
            {error && (
              <div className="w-full p-3 mb-6 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20 text-center">
                {error}
              </div>
            )}

            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            
            <Button 
              onClick={handleSSOLogin} 
              disabled={isLoading}
              size="lg"
              className="w-full text-base h-12 shadow-md hover:shadow-lg transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authentification en cours...
                </>
              ) : (
                "Se connecter via SSO"
              )}
            </Button>
            
            <p className="mt-6 text-xs text-muted-foreground text-center">
              En vous connectant, vous acceptez la politique d'utilisation interne OASIS.
              Tout accès non autorisé est strictement interdit.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
