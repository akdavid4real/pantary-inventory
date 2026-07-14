import { Eye, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import loginBackground from "../../../assets/auth/login-food-background.webp";
import { Brand } from "../../components/Brand";
import { ScreenProps } from "../../types/navigation";
import { AuthSession, publicApi, saveSession } from "../../services/api";

export function Login({ onNavigate }: ScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      const session = await publicApi<AuthSession>("/auth/login", {
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      saveSession(session);
      onNavigate("Home");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="auth auth--login">
      <section
        className="auth-art"
        style={{ backgroundImage: `url(${loginBackground})` }}
      >
        <Brand inverse />
        <div className="auth-art-copy">
          <i />
          <h1>
            Welcome back
            <br />
            to your kitchen.
          </h1>
          <p>
            Plan smarter, eat better, and make every meal a moment to enjoy.
          </p>
        </div>
      </section>
      <section className="auth-form">
        <form onSubmit={submit}>
          <h1>Welcome back</h1>
          <p>Sign in to continue planning meals you’ll love.</p>
          <label className="auth-field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                aria-label="Show password"
                onClick={() => setShowPassword(!showPassword)}
              >
                <Eye />
              </button>
            </div>
          </label>
          <div className="auth-options">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />{" "}
              Remember me
            </label>
            <button type="button" onClick={() => onNavigate("forgot-password")}>
              Forgot password?
            </button>
          </div>
          {error ? <p role="alert">{error}</p> : null}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <div className="auth-divider">
            <span>or continue with</span>
          </div>
          <button className="google-button" type="button">
            <b>G</b> Continue with Google
          </button>
          <p className="auth-switch">
            New to Pantry-to-Plate?{" "}
            <button type="button" onClick={() => onNavigate("sign-up")}>
              Create an account
            </button>
          </p>
          <p className="auth-security">
            <LockKeyhole /> Your data is secure. We use industry-standard
            encryption to protect your information.
          </p>
        </form>
      </section>
    </main>
  );
}
