-- Add agent referral fields to saloon_subscriptions
-- Task: Captain K agent tracking for saloon sales

ALTER TABLE saloon_subscriptions
  ADD COLUMN IF NOT EXISTS agent_referral_code text;

ALTER TABLE saloon_subscriptions
  ADD COLUMN IF NOT EXISTS agent_id uuid;
