-- Fix database relationships and optimize performance
-- Run this script in your Supabase SQL editor

-- 1. Ensure proper foreign key relationships exist
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_agent_id_fkey;

ALTER TABLE properties 
ADD CONSTRAINT properties_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

-- 3. Add GIN indexes for JSONB columns (location, specifications, amenities)
CREATE INDEX IF NOT EXISTS idx_properties_location_gin ON properties USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_properties_specifications_gin ON properties USING GIN(specifications);
CREATE INDEX IF NOT EXISTS idx_properties_amenities_gin ON properties USING GIN(amenities);

-- 4. Add text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_properties_title_search ON properties USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_properties_description_search ON properties USING GIN(to_tsvector('english', description));

-- 5. Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_properties_status_agent_created ON properties(status, agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_properties_status_type_price ON properties(status, type, price);

-- 6. Optimize profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 7. Add indexes for other tables if they exist
CREATE INDEX IF NOT EXISTS idx_property_tenancies_tenant_id ON property_tenancies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_tenancies_status ON property_tenancies(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 8. Add a function to update search vectors automatically
CREATE OR REPLACE FUNCTION update_property_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Add search_vector column if it doesn't exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 10. Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS update_property_search_vector_trigger ON properties;
CREATE TRIGGER update_property_search_vector_trigger
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_property_search_vector();

-- 11. Update existing records with search vectors
UPDATE properties SET search_vector = to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''));

-- 12. Add index on search vector
CREATE INDEX IF NOT EXISTS idx_properties_search_vector ON properties USING GIN(search_vector);

-- 13. Add RLS policies if they don't exist
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read available properties
DROP POLICY IF EXISTS "Available properties are viewable by everyone" ON properties;
CREATE POLICY "Available properties are viewable by everyone" ON properties
  FOR SELECT USING (status = 'available' OR auth.uid() = agent_id);

-- Allow agents to manage their own properties
DROP POLICY IF EXISTS "Agents can manage own properties" ON properties;
CREATE POLICY "Agents can manage own properties" ON properties
  FOR ALL USING (auth.uid() = agent_id);

-- 14. Optimize table statistics
ANALYZE properties;
ANALYZE profiles;
ANALYZE property_tenancies;
ANALYZE transactions;
ANALYZE notifications;

-- 15. Add helpful views for common queries
CREATE OR REPLACE VIEW available_properties_with_agents AS
SELECT 
  p.*,
  pr.full_name as agent_name,
  pr.email as agent_email,
  pr.phone as agent_phone,
  pr.verified as agent_verified
FROM properties p
INNER JOIN profiles pr ON p.agent_id = pr.id
WHERE p.status = 'available' AND pr.verified = true;

-- 16. Create a function to get property statistics
CREATE OR REPLACE FUNCTION get_property_stats()
RETURNS TABLE(
  total_properties bigint,
  available_properties bigint,
  occupied_properties bigint,
  avg_price numeric,
  verified_agents bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_properties,
    COUNT(*) FILTER (WHERE status = 'available') as available_properties,
    COUNT(*) FILTER (WHERE status = 'occupied') as occupied_properties,
    AVG(price) as avg_price,
    COUNT(DISTINCT agent_id) FILTER (WHERE profiles.verified = true) as verified_agents
  FROM properties
  LEFT JOIN profiles ON properties.agent_id = profiles.id;
END;
$$ LANGUAGE plpgsql;

-- 17. Add a function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete old notifications (older than 6 months)
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '6 months';
  
  -- Delete old transactions (older than 2 years)
  DELETE FROM transactions 
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Log cleanup
  RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- 18. Create saved_properties table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- 19. Add indexes for saved_properties
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON saved_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_created_at ON saved_properties(created_at);

-- 20. Add RLS for saved_properties
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own saved properties
DROP POLICY IF EXISTS "Users can manage own saved properties" ON saved_properties;
CREATE POLICY "Users can manage own saved properties" ON saved_properties
  FOR ALL USING (auth.uid() = user_id);

-- 21. Create calendar_bookings table for enhanced booking system
CREATE TABLE IF NOT EXISTS calendar_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  booking_type TEXT CHECK (booking_type IN ('viewing', 'lease', 'purchase')) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('tinympesa', 'stripe')),
  payment_reference TEXT,
  status TEXT CHECK (status IN ('confirmed', 'completed', 'cancelled')) DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. Create calendar_events table for calendar integration
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES calendar_bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_type TEXT CHECK (user_type IN ('tenant', 'agent')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('confirmed', 'completed', 'cancelled')) DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 23. Add indexes for calendar tables
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_property_id ON calendar_bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_tenant_id ON calendar_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_agent_id ON calendar_bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_date ON calendar_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_status ON calendar_bookings(status);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_booking_id ON calendar_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_property_id ON calendar_events(property_id);

-- 24. Add RLS policies for calendar tables
ALTER TABLE calendar_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Users can see bookings they're involved in (as tenant or agent)
DROP POLICY IF EXISTS "Users can view relevant bookings" ON calendar_bookings;
CREATE POLICY "Users can view relevant bookings" ON calendar_bookings
  FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = agent_id);

-- Users can create bookings as tenants
DROP POLICY IF EXISTS "Tenants can create bookings" ON calendar_bookings;
CREATE POLICY "Tenants can create bookings" ON calendar_bookings
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- Agents can update bookings for their properties
DROP POLICY IF EXISTS "Agents can update bookings" ON calendar_bookings;
CREATE POLICY "Agents can update bookings" ON calendar_bookings
  FOR UPDATE USING (auth.uid() = agent_id);

-- Users can see their own calendar events
DROP POLICY IF EXISTS "Users can view own calendar events" ON calendar_events;
CREATE POLICY "Users can view own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own calendar events
DROP POLICY IF EXISTS "Users can create calendar events" ON calendar_events;
CREATE POLICY "Users can create calendar events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own calendar events
DROP POLICY IF EXISTS "Users can update own calendar events" ON calendar_events;
CREATE POLICY "Users can update own calendar events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

-- 25. Create triggers for updated_at columns
CREATE TRIGGER update_calendar_bookings_updated_at BEFORE UPDATE ON calendar_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 26. Create a function to get upcoming appointments
CREATE OR REPLACE FUNCTION get_upcoming_appointments(user_id_param UUID, user_type_param TEXT)
RETURNS TABLE(
  booking_id UUID,
  property_title TEXT,
  property_address TEXT,
  booking_type TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  other_party_name TEXT,
  other_party_email TEXT,
  amount_paid DECIMAL
) AS $$
BEGIN
  IF user_type_param = 'tenant' THEN
    RETURN QUERY
    SELECT 
      cb.id as booking_id,
      p.title as property_title,
      p.location->>'address' as property_address,
      cb.booking_type,
      cb.scheduled_date,
      cb.scheduled_time,
      agent.full_name as other_party_name,
      agent.email as other_party_email,
      cb.amount_paid
    FROM calendar_bookings cb
    JOIN properties p ON cb.property_id = p.id
    JOIN profiles agent ON cb.agent_id = agent.id
    WHERE cb.tenant_id = user_id_param
      AND cb.scheduled_date >= CURRENT_DATE
      AND cb.status = 'confirmed'
    ORDER BY cb.scheduled_date, cb.scheduled_time;
  ELSE
    RETURN QUERY
    SELECT 
      cb.id as booking_id,
      p.title as property_title,
      p.location->>'address' as property_address,
      cb.booking_type,
      cb.scheduled_date,
      cb.scheduled_time,
      tenant.full_name as other_party_name,
      tenant.email as other_party_email,
      cb.amount_paid
    FROM calendar_bookings cb
    JOIN properties p ON cb.property_id = p.id
    JOIN profiles tenant ON cb.tenant_id = tenant.id
    WHERE cb.agent_id = user_id_param
      AND cb.scheduled_date >= CURRENT_DATE
      AND cb.status = 'confirmed'
    ORDER BY cb.scheduled_date, cb.scheduled_time;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 27. Create a scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT cleanup_old_data();');

COMMIT;