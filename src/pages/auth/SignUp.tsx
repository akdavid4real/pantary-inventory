import { Eye, Leaf, ShoppingBasket } from "lucide-react";
import { FormEvent, useState } from "react";
import signupBackground from "../../../assets/auth/signup-food-background.png";
import { Brand } from "../../components/Brand";
import { ScreenProps } from "../../types/navigation";
import { AuthSession, publicApi, saveSession } from "../../services/api";

export function SignUp({ onNavigate }: ScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirmPassword"))) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const session = await publicApi<AuthSession>("/auth/signup", {
        displayName: String(form.get("displayName")),
        email: String(form.get("email")),
        password,
      });
      if (!session.access_token) throw new Error("Check your email to confirm your account, then sign in.");
      saveSession(session);
      sessionStorage.setItem("onboarding-display-name", String(form.get("displayName")));
      onNavigate("onboarding-1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="auth auth--signup">
      <section
        className="auth-art"
        style={{ backgroundImage: `url(${signupBackground})` }}
      >
        <Brand inverse />
        <div className="auth-art-copy signup-copy">
          <h1>
            Your pantry.
            <br />
            Your tastes.
            <br />
            <em>Better meals.</em>
          </h1>
          <i />
          <p>
            Turn the ingredients you already have into delicious Nigerian meals
            you’ll love.
          </p>
          <ul>
            <li>
              <Leaf />
              <span>
                <b>Personalized Nigerian meal ideas</b>
                <small>Recipes tailored to your tastes and ingredients.</small>
              </span>
            </li>
            <li>
              <ShoppingBasket />
              <span>
                <b>Smarter pantry planning</b>
                <small>Plan meals, shop smarter, and stay organized.</small>
              </span>
            </li>
            <li>
              <Leaf />
              <span>
                <b>Less food waste</b>
                <small>Make the most of what you have and reduce waste.</small>
              </span>
            </li>
          </ul>
        </div>
      </section>
      <section className="auth-form">
        <form onSubmit={submit}>
          <h1>Create your account</h1>
          <p>Start turning everyday ingredients into meals made for you.</p>
          <label className="auth-field">
            <span>Full name</span>
            <input name="displayName" autoComplete="name" required />
          </label>
          <label className="auth-field">
            <span>Email</span>
            <input name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                minLength={8}
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
          <div className="password-strength">
            <i />
            <i />
            <i />
            <i />
            <span>Strong</span>
          </div>
          <label className="auth-field">
            <span>Confirm password</span>
            <div>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
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
          <label className="terms">
            <input type="checkbox" defaultChecked required /> I agree to the{" "}
            <a href="#terms">Terms of Service</a> and{" "}
            <a href="#privacy">Privacy Policy</a>.
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
          <div className="auth-divider">
            <span>or</span>
          </div>
          <button className="google-button" type="button">
            <b>G</b> Sign up with Google
          </button>
          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" onClick={() => onNavigate("login")}>
              Sign in
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
