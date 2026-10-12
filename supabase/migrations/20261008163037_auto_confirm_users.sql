-- Auto-confirm user emails (required for local development/expo demo without email sending setup)

CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically confirm the email address on signup
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists to allow idempotent runs
DROP TRIGGER IF EXISTS auto_confirm_user_email ON auth.users;

-- Create the trigger to run BEFORE INSERT on auth.users
CREATE TRIGGER auto_confirm_user_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_email();

-- Also confirm any existing users that might have been created while confirmation was required
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email_confirmed_at IS NULL OR confirmed_at IS NULL;
