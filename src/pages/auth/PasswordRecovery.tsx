import { LockKeyhole } from "lucide-react";
import { Field } from "../../components/dashboard/PageElements";
import { screenImages } from "../../features/dashboard/screenData";
import { ScreenProps } from "../../types/navigation";

export function PasswordRecovery({
  mode,
  onNavigate,
}: ScreenProps & { mode: string }) {
  const reset = mode === "reset-password";
  return (
    <main className="auth auth--recovery">
      <section className="auth-art legacy-auth-art">
        <div>
          <LockKeyhole />
          <b>Pantry-to-Plate</b>
        </div>
        <h1>Real ingredients. Real meals. Real results.</h1>
        <img src={screenImages.egusi} alt="Egusi soup with traditional sides" />
      </section>
      <section className="auth-form legacy-auth-form">
        <div>
          <LockKeyhole size={42} />
          <h1>{reset ? "Create a new password" : "Forgot your password?"}</h1>
          <p>
            {reset
              ? "Choose a strong password to keep your account secure."
              : "Enter your email and we’ll send you a secure reset link."}
          </p>
          {reset ? (
            <>
              <Field label="New password" value="••••••••" />
              <Field label="Confirm password" value="••••••••" />
            </>
          ) : (
            <Field label="Email address" value="akdavid@example.com" />
          )}
          <button className="auth-submit" onClick={() => onNavigate("login")}>
            {reset ? "Reset password" : "Send reset link"}
          </button>
          <button className="text-button" onClick={() => onNavigate("login")}>
            Back to sign in
          </button>
        </div>
      </section>
    </main>
  );
}
