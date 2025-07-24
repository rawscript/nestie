-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_details JSONB NOT NULL DEFAULT '{}',
    deposit_amount DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    agent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_agent_approval',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    agent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    type VARCHAR(50) NOT NULL DEFAULT 'deposit',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_earnings table
CREATE TABLE IF NOT EXISTS agent_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'deposit_commission',
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_agent_id ON payments(agent_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_agent_earnings_agent_id ON agent_earnings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_earnings_status ON agent_earnings(status);

-- Add pending_booking_id to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pending_booking_id UUID REFERENCES bookings(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS created_by_agent BOOLEAN DEFAULT false;

-- Update existing properties to mark them as agent-created
UPDATE properties SET created_by_agent = true WHERE agent_id IS NOT NULL;

-- Add verified column to profiles for agent verification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Create RLS policies for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own bookings" ON bookings
    FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Agents can view their property bookings" ON bookings
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Tenants can create bookings" ON bookings
    FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Agents can update their bookings" ON bookings
    FOR UPDATE USING (agent_id = auth.uid());

-- Create RLS policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (tenant_id = auth.uid() OR agent_id = auth.uid());

CREATE POLICY "System can create payment records" ON payments
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for agent_earnings
ALTER TABLE agent_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own earnings" ON agent_earnings
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "System can create earnings records" ON agent_earnings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Agents can update their earnings" ON agent_earnings
    FOR UPDATE USING (agent_id = auth.uid());