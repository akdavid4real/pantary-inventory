import { Eye, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import loginBackground from "../../../assets/auth/login-food-background.png";
import { Brand } from "../../components/Brand";
import { ScreenProps } from "../../types/navigation";

export function Login({ onNavigate }: ScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onNavigate("Home");
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
            <input type="email" defaultValue="akdavid@example.com" required />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <div>
              <input
                type={showPassword ? "text" : "password"}
                defaultValue="pantrytoplate"
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
          <button className="auth-submit" type="submit">
            Sign in
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
