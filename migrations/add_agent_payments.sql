-- Agent Payment Accounts Table
CREATE TABLE IF NOT EXISTS agent_payment_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('bank', 'mobile_money', 'paypal')),
  account_details JSONB NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Earnings Table
CREATE TABLE IF NOT EXISTS agent_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  earning_type VARCHAR(20) NOT NULL CHECK (earning_type IN ('commission', 'booking_fee', 'service_fee')),
  amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  original_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'failed')),
  payment_account_id UUID REFERENCES agent_payment_accounts(id) ON DELETE SET NULL,
  payment_reference VARCHAR(100),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout Requests Table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_account_id UUID NOT NULL REFERENCES agent_payment_accounts(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'completed', 'failed')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  payment_reference VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_payment_accounts_agent_id ON agent_payment_accounts(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_payment_accounts_is_primary ON agent_payment_accounts(agent_id, is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_agent_earnings_agent_id ON agent_earnings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_earnings_property_id ON agent_earnings(property_id);
CREATE INDEX IF NOT EXISTS idx_agent_earnings_status ON agent_earnings(status);
CREATE INDEX IF NOT EXISTS idx_agent_earnings_created_at ON agent_earnings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payout_requests_agent_id ON payout_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON payout_requests(created_at DESC);

-- RLS Policies
ALTER TABLE agent_payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Agent Payment Accounts Policies
CREATE POLICY "Agents can view their own payment accounts" ON agent_payment_accounts
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert their own payment accounts" ON agent_payment_accounts
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their own payment accounts" ON agent_payment_accounts
  FOR UPDATE USING (agent_id = auth.uid());

-- Agent Earnings Policies
CREATE POLICY "Agents can view their own earnings" ON agent_earnings
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "System can insert earnings" ON agent_earnings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update earnings" ON agent_earnings
  FOR UPDATE USING (true);

-- Payout Requests Policies
CREATE POLICY "Agents can view their own payout requests" ON payout_requests
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert their own payout requests" ON payout_requests
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Admins can view all payout requests" ON payout_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update payout requests" ON payout_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_payment_accounts_updated_at 
  BEFORE UPDATE ON agent_payment_accounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_earnings_updated_at 
  BEFORE UPDATE ON agent_earnings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_requests_updated_at 
  BEFORE UPDATE ON payout_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically process commission when payment is made
CREATE OR REPLACE FUNCTION process_agent_commission()
RETURNS TRIGGER AS $$
DECLARE
  property_agent_id UUID;
  commission_rate DECIMAL(5,4) := 0.10; -- 10% default commission
  commission_amount DECIMAL(10,2);
BEGIN
  -- Only process for completed payments that earn commission
  IF NEW.status = 'completed' AND OLD.status != 'completed' 
     AND NEW.transaction_type IN ('rent_payment', 'deposit_payment', 'booking_payment', 'maintenance_request', 'lease_renewal') THEN
    
    -- Get the agent ID from the property
    SELECT agent_id INTO property_agent_id
    FROM properties p
    JOIN property_tenancies pt ON p.id = pt.property_id
    WHERE pt.id = NEW.tenancy_id;
    
    IF property_agent_id IS NOT NULL AND NEW.amount IS NOT NULL THEN
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
        pt.property_id,
        NEW.user_id,
        NEW.id,
        'commission',
        commission_amount,
        commission_rate,
        NEW.amount,
        'pending'
      FROM property_tenancies pt
      WHERE pt.id = NEW.tenancy_id;
      
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

-- Create trigger for automatic commission processing
CREATE TRIGGER trigger_process_agent_commission
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION process_agent_commission();