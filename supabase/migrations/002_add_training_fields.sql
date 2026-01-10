-- Add training onboarding fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS training_onboarded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS training_days INTEGER;

-- Add comment to document the fields
COMMENT ON COLUMN users.training_onboarded IS 'Whether the user has completed the training onboarding wizard';
COMMENT ON COLUMN users.training_days IS 'Number of days per week the user trains';
