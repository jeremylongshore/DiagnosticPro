import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleWhopCallback } from "@/lib/whop-auth";
import LoadingSpinner from "@/components/LoadingSpinner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state") ?? undefined;

    if (!code) {
      setError("No authorization code received from Whop.");
      return;
    }

    handleWhopCallback(code, state)
      .then((auth) => {
        if (auth.isMember) {
          navigate("/?whop=member", { replace: true });
        } else {
          navigate("/?whop=upgrade", { replace: true });
        }
      })
      .catch((err) => {
        console.error("Whop callback error:", err);
        setError(err.message || "Authentication failed. Please try again.");
      });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Authentication Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover active:bg-primary-active transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return <LoadingSpinner />;
};

export default AuthCallback;
