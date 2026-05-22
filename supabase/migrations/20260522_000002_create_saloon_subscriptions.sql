-- Create saloon_subscriptions table
-- Tracks subscription plans, billing, and agent referrals for Saloon AI clients

CREATE TABLE IF NOT EXISTS saloon_subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which saloon this subscription belongs to
  saloon_name           text,
  saloon_owner_name     text,
  saloon_phone          text,
  saloon_email          text,

  -- Plan info
  plan_name             text NOT NULL DEFAULT 'basic',   -- 'basic' | 'pro'
  status                text NOT NULL DEFAULT 'active',  -- 'trial' | 'active' | 'cancelled' | 'expired'
  setup_fee             numeric(10,2),
  monthly_fee           numeric(10,2),

  -- Dates
  started_at            timestamptz DEFAULT now(),
  trial_ends_at         timestamptz,
  next_billing_at       timestamptz,
  cancelled_at          timestamptz,

  -- Stripe
  stripe_customer_id    text,
  stripe_subscription_id text,
  stripe_payment_link   text,

  -- Agent referral (added for Captain K agent tracking)
  agent_referral_code   text,
  agent_id              uuid,

  -- Meta
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Index for agent lookups
CREATE INDEX IF NOT EXISTS idx_saloon_subscriptions_agent_id
  ON saloon_subscriptions (agent_id);

CREATE INDEX IF NOT EXISTS idx_saloon_subscriptions_agent_code
  ON saloon_subscriptions (agent_referral_code);

CREATE INDEX IF NOT EXISTS idx_saloon_subscriptions_status
  ON saloon_subscriptions (status);
