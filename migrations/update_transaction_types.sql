-- Update transaction_type constraints to include all supported types
-- This migration ensures consistency between the application types and database constraints

-- Drop existing constraint if it exists
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;

-- Add updated constraint with all supported transaction types
ALTER TABLE transactions ADD CONSTRAINT transactions_transaction_type_check 
  CHECK (transaction_type IN (
    'rent_payment', 
    'deposit_payment', 
    'rent_termination', 
    'lease_renewal', 
    'maintenance_request', 
    'booking_payment'
  ));

-- Update the agent earnings trigger to handle all commission-eligible transaction types
DROP TRIGGER IF EXISTS trigger_process_agent_commission ON transactions;

-- Recreate the trigger function with updated transaction types
CREATE OR REPLACE FUNCTION process_agent_commission()
RETURNS TRIGGER AS $$
DECLARE
  property_agent_id UUID;
  commission_rate DECIMAL(5,4);
  commission_amount DECIMAL(10,2);
  earning_type TEXT;
BEGIN
  -- Only process for completed payments that earn commission
  IF NEW.status = 'completed' AND OLD.status != 'completed' 
     AND NEW.transaction_type IN ('rent_payment', 'deposit_payment', 'booking_payment', 'maintenance_request', 'lease_renewal') THEN
    
    -- Get the agent ID from the property
    SELECT agent_id INTO property_agent_id
    FROM properties p
    JOIN property_tenancies pt ON p.id = pt.property_id
    WHERE pt.id = NEW.tenancy_id;
    
    -- If no tenancy_id, try to get agent directly from property
    IF property_agent_id IS NULL AND NEW.tenancy_id IS NULL THEN
      SELECT agent_id INTO property_agent_id
      FROM properties p
      WHERE p.id::text = NEW.property_id;
    END IF;
    
    IF property_agent_id IS NOT NULL AND NEW.amount IS NOT NULL THEN
      -- Determine commission rate and earning type based on transaction type
      CASE NEW.transaction_type
        WHEN 'rent_payment' THEN
          commission_rate := 0.10; -- 10%
          earning_type := 'commission';
        WHEN 'deposit_payment' THEN
          commission_rate := 0.05; -- 5%
          earning_type := 'commission';
        WHEN 'booking_payment' THEN
          commission_rate := 0.15; -- 15%
          earning_type := 'booking_fee';
        WHEN 'maintenance_request' THEN
          commission_rate := 0.05; -- 5%
          earning_type := 'service_fee';
        WHEN 'lease_renewal' THEN
          commission_rate := 0.08; -- 8%
          earning_type := 'service_fee';
        ELSE
          commission_rate := 0.08; -- 8% default
          earning_type := 'service_fee';
      END CASE;
      
      commission_amount := NEW.amount * commission_rate;
      
      -- Insert agent earning record
      INSERT INTO agent_earnings (
        agent_id,
        property_id,
        tenant_id,
        transaction_id,
        earning_type,
        amount,
        commission_rate,
        original_amount,
        status
      )
      SELECT 
        property_agent_id,
        COALESCE(pt.property_id::text, NEW.property_id),
        NEW.user_id,
        NEW.id,
        earning_type,
        commission_amount,
        commission_rate,
        NEW.amount,
        'pending'
      FROM property_tenancies pt
      WHERE pt.id = NEW.tenancy_id
      
      UNION ALL
      
      -- Handle direct property payments (no tenancy)
      SELECT 
        property_agent_id,
        NEW.property_id,
        NEW.user_id,
        NEW.id,
        earning_type,
        commission_amount,
        commission_rate,
        NEW.amount,
        'pending'
      WHERE NEW.tenancy_id IS NULL
      
      LIMIT 1;
      
      -- Update agent stats
      UPDATE profiles 
      SET stats = COALESCE(stats, '{}'::jsonb) || 
                  jsonb_build_object('total_earnings', 
                    COALESCE((stats->>'total_earnings')::decimal, 0) + commission_amount)
      WHERE id = property_agent_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_process_agent_commission
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION process_agent_commission();

-- Add index for better performance on transaction_type queries
CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON transactions(transaction_type, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, transaction_type);