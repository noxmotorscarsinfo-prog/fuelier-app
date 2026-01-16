-- Migration: Add scaling control fields to custom_meals table
-- Date: 2026-01-16
-- Purpose: Add is_scalable and scaling_type fields to support fixed/scalable meal distinction

-- Add new columns for scaling control
ALTER TABLE custom_meals 
ADD COLUMN IF NOT EXISTS is_scalable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS scaling_type TEXT DEFAULT 'scalable',
ADD COLUMN IF NOT EXISTS allow_scaling BOOLEAN DEFAULT true;

-- Add constraint for scaling_type
ALTER TABLE custom_meals 
ADD CONSTRAINT check_scaling_type 
CHECK (scaling_type IN ('scalable', 'fixed'));

-- Update existing rows to have default values
UPDATE custom_meals 
SET 
  is_scalable = true,
  scaling_type = 'scalable',
  allow_scaling = true
WHERE is_scalable IS NULL OR scaling_type IS NULL OR allow_scaling IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_custom_meals_scaling 
ON custom_meals(user_id, scaling_type);

-- Add comments
COMMENT ON COLUMN custom_meals.is_scalable IS 'Whether this meal can be scaled to match macros (true) or should remain fixed (false)';
COMMENT ON COLUMN custom_meals.scaling_type IS 'Type of scaling: scalable (can be adjusted) or fixed (unchangeable portions)';
COMMENT ON COLUMN custom_meals.allow_scaling IS 'Runtime flag to control scaling behavior';