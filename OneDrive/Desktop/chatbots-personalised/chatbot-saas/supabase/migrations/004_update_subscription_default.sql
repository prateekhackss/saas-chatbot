-- Change the default subscription status to incomplete since users must now enter a card to start a trial
ALTER TABLE clients
ALTER COLUMN subscription_status SET DEFAULT 'incomplete';

-- Update existing trialists without a real razorpay subscription if needed
UPDATE clients 
SET subscription_status = 'incomplete' 
WHERE subscription_status = 'trialing' 
  AND id NOT IN (SELECT client_id FROM subscriptions);
