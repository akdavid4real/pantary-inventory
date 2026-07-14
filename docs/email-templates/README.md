# Supabase authentication email templates

## Confirm signup

Use this subject in **Supabase → Authentication → Email → Templates → Confirm signup**:

```text
{{ .Token }} is your Pantry to Plate verification code
```

Paste the complete contents of `confirm-signup.html` into the message body and save it.

The template deliberately uses `{{ .Token }}` instead of `{{ .ConfirmationURL }}` so signup sends a six-digit verification code. The logo is hosted by the Vite application at:

```text
https://www.pantrytoplate.name.ng/logo_pantry-to-plate_email_20260714_light.png
```

Push and deploy the public logo asset before sending the first production test email.
