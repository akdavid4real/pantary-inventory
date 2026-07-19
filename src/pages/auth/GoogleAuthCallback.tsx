import { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { readOAuthCallbackSession, saveSession } from "../../services/api";
import { ScreenProps } from "../../types/navigation";

export function GoogleAuthCallback({ onNavigate }: ScreenProps) {
  const [error, setError] = useState("");

  useEffect(() => {
    const session = readOAuthCallbackSession();
    if (!session) {
      setError("Google sign-in did not return a session. Please try again.");
      return;
    }

    saveSession(session);
    window.history.replaceState({}, "", "/auth/callback");
    onNavigate("Home");
  }, [onNavigate]);

  if (error) {
    return (
      <main className="auth-callback" role="alert">
        <AlertCircle aria-hidden="true" />
        <h1>We couldn’t sign you in</h1>
        <p>{error}</p>
        <button type="button" onClick={() => onNavigate("login")}>Back to sign in</button>
      </main>
    );
  }

  return (
    <main className="auth-callback" aria-live="polite">
      <LoaderCircle className="animate-spin" aria-hidden="true" />
      <h1>Signing you in with Google…</h1>
      <p>Please wait a moment.</p>
    </main>
  );
}
