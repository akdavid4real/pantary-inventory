import { Eye, Leaf, MailCheck, ShoppingBasket } from "lucide-react";
import { FormEvent, useState } from "react";
import signupBackground from "../../../assets/auth/signup-food-background.webp";
import { Brand } from "../../components/Brand";
import { ScreenProps } from "../../types/navigation";
import { AuthSession, publicApi, saveSession, SignUpResponse } from "../../services/api";

export function SignUp({ onNavigate }: ScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [pendingDisplayName, setPendingDisplayName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resendMessage, setResendMessage] = useState("");
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
      const email = String(form.get("email")).trim();
      const response = await publicApi<SignUpResponse>("/auth/signup", {
        displayName: String(form.get("displayName")),
        email,
        password,
      });
      if (!response.access_token || !response.refresh_token) {
        setPendingDisplayName(String(form.get("displayName")));
        setConfirmationEmail(email);
        return;
      }
      saveSession(response as AuthSession);
      sessionStorage.setItem("onboarding-display-name", String(form.get("displayName")));
      onNavigate("onboarding-1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await publicApi<AuthSession>("/auth/verify-email", {
        email: confirmationEmail,
        token: verificationCode,
      });
      saveSession(session);
      sessionStorage.setItem("onboarding-display-name", pendingDisplayName);
      onNavigate("onboarding-1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to verify this code.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    setError("");
    setResendMessage("");
    try {
      await publicApi("/auth/resend-confirmation", { email: confirmationEmail });
      setResendMessage("A new confirmation code has been sent.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to resend the code.");
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
        {confirmationEmail ? (
          <form className="auth-confirmation" onSubmit={verifyCode}>
            <MailCheck aria-hidden="true" />
            <h1>Enter your code</h1>
            <p>
              We sent a six-digit confirmation code to <strong>{confirmationEmail}</strong>.
            </p>
            <label className="auth-code-field">
              <span>Confirmation code</span>
              <input
                aria-label="Six-digit confirmation code"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="000000"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </label>
            {error ? <p className="auth-confirmation-error" role="alert">{error}</p> : null}
            {resendMessage ? <p className="auth-confirmation-success" role="status">{resendMessage}</p> : null}
            <button className="auth-submit" type="submit" disabled={loading || verificationCode.length !== 6}>
              {loading ? "Checking code..." : "Confirm and continue"}
            </button>
            <button className="auth-confirmation-secondary" type="button" disabled={loading} onClick={resendCode}>
              Resend code
            </button>
            <button className="auth-confirmation-secondary" type="button" disabled={loading} onClick={() => setConfirmationEmail("")}>
              Use a different email
            </button>
          </form>
        ) : (
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
          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" onClick={() => onNavigate("login")}>
              Sign in
            </button>
          </p>
        </form>
        )}
      </section>
    </main>
  );
}
