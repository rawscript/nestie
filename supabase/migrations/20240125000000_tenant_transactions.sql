-- Create transactions table for tenant actions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('rent_payment', 'rent_termination', 'lease_renewal', 'maintenance_request', 'deposit_payment')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  amount DECIMAL(10,2),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  authorized_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create property_tenancies table to track current tenants
CREATE TABLE IF NOT EXISTS property_tenancies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT NOT NULL,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'terminated', 'expired')),
  lease_terms JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_records table for tracking payments
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES property_tenancies(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}'
);

-- Create notifications table for real-time updates
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('transaction', 'payment', 'authorization', 'property_update')),
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_agent_id ON transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_property_id ON transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_property_tenancies_property_id ON property_tenancies(property_id);
CREATE INDEX IF NOT EXISTS idx_property_tenancies_tenant_id ON property_tenancies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_tenancies_status ON property_tenancies(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = agent_id);

CREATE POLICY "Tenants can create transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Agents can update transaction status" ON transactions
  FOR UPDATE USING (auth.uid() = agent_id);

-- RLS Policies for property_tenancies
CREATE POLICY "Users can view their tenancies" ON property_tenancies
  FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = agent_id);

CREATE POLICY "Agents can manage tenancies" ON property_tenancies
  FOR ALL USING (auth.uid() = agent_id);

-- RLS Policies for payment_records
CREATE POLICY "Users can view their payment records" ON payment_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transactions t 
      WHERE t.id = payment_records.transaction_id 
      AND (t.tenant_id = auth.uid() OR t.agent_id = auth.uid())
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, data)
  VALUES (p_user_id, p_title, p_message, p_type, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle transaction status updates
CREATE OR REPLACE FUNCTION handle_transaction_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If transaction is approved by agent
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    NEW.authorized_at = NOW();
    
    -- Create notification for tenant
    PERFORM create_notification(
      NEW.tenant_id,
      'Transaction Approved',
      'Your ' || NEW.transaction_type || ' request has been approved by the agent.',
      'authorization',
      jsonb_build_object('transaction_id', NEW.id, 'transaction_type', NEW.transaction_type)
    );
    
    -- Handle rent termination approval
    IF NEW.transaction_type = 'rent_termination' THEN
      -- Update property tenancy status
      UPDATE property_tenancies 
      SET status = 'terminated', end_date = CURRENT_DATE, updated_at = NOW()
      WHERE property_id = NEW.property_id AND tenant_id = NEW.tenant_id AND status = 'active';
      
      -- Update property availability in your properties table
      -- This would depend on your properties table structure
    END IF;
    
  -- If transaction is completed
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
    
    -- Create notification for both parties
    PERFORM create_notification(
      NEW.tenant_id,
      'Transaction Completed',
      'Your ' || NEW.transaction_type || ' has been completed successfully.',
      'transaction',
      jsonb_build_object('transaction_id', NEW.id, 'transaction_type', NEW.transaction_type)
    );
    
    PERFORM create_notification(
      NEW.agent_id,
      'Transaction Completed',
      'Transaction for ' || NEW.transaction_type || ' has been completed.',
      'transaction',
      jsonb_build_object('transaction_id', NEW.id, 'transaction_type', NEW.transaction_type)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for transaction updates
CREATE TRIGGER transaction_update_trigger
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_transaction_update();

-- Function to get agent properties with tenancy info
CREATE OR REPLACE FUNCTION get_agent_properties_with_tenancies(agent_uuid UUID)
RETURNS TABLE (
  property_id TEXT,
  tenant_id UUID,
  tenant_email TEXT,
  monthly_rent DECIMAL,
  tenancy_status TEXT,
  start_date DATE,
  end_date DATE,
  pending_transactions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.property_id,
    pt.tenant_id,
    u.email as tenant_email,
    pt.monthly_rent,
    pt.status as tenancy_status,
    pt.start_date,
    pt.end_date,
    COALESCE(t.pending_count, 0)::INTEGER as pending_transactions
  FROM property_tenancies pt
  LEFT JOIN auth.users u ON u.id = pt.tenant_id
  LEFT JOIN (
    SELECT property_id, COUNT(*) as pending_count
    FROM transactions 
    WHERE status = 'pending' AND agent_id = agent_uuid
    GROUP BY property_id
  ) t ON t.property_id = pt.property_id
  WHERE pt.agent_id = agent_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;