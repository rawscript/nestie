-- Complete Nestie Database Setup Script
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS property_views CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS calendar_bookings CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS saved_searches CASCADE;
DROP TABLE IF EXISTS saved_properties CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS property_tenancies CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS cleanup_old_data() CASCADE;
DROP FUNCTION IF EXISTS get_property_stats() CASCADE;
DROP FUNCTION IF EXISTS get_upcoming_appointments(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS properties_within_radius(FLOAT, FLOAT, FLOAT) CASCADE;
DROP FUNCTION IF EXISTS update_property_geolocation() CASCADE;
DROP FUNCTION IF EXISTS update_property_search_vector() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop existing views
DROP VIEW IF EXISTS available_properties_with_agents CASCADE;

-- Start transaction
BEGIN;

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('tenant', 'agent')) NOT NULL,
  avatar_url TEXT,
  location TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create properties table with geographic support
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('apartment', 'house', 'commercial', 'land')) NOT NULL,
  listingType TEXT CHECK (listingType IN ('rent', 'sale', 'lease')) NOT NULL DEFAULT 'rent',
  status TEXT CHECK (status IN ('available', 'occupied', 'sold', 'pending')) DEFAULT 'available',
  
  -- Location data (JSONB for flexibility + PostGIS for geographic queries)
  location JSONB NOT NULL,
  geolocation GEOGRAPHY(POINT, 4326), -- PostGIS geographic point
  
  -- Property specifications
  specifications JSONB DEFAULT '{}', -- bedrooms, bathrooms, area, parking, furnished, etc.
  
  -- Amenities and features
  amenities JSONB DEFAULT '{}', -- wifi, pool, gym, security, etc.
  
  -- Terms and conditions
  terms JSONB DEFAULT '{}', -- deposit, lease_period, payment_method, utilities, etc.
  
  -- Media
  images TEXT[] DEFAULT '{}',
  virtual_tour_url TEXT,
  
  -- Contact information
  contactInfo JSONB DEFAULT '{}', -- phone, email, etc.
  
  -- Agent relationship
  agent_id UUID REFERENCES profiles(id) NOT NULL,
  created_by_agent BOOLEAN DEFAULT TRUE,
  
  -- Search optimization
  search_vector tsvector,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create property_tenancies table
CREATE TABLE IF NOT EXISTS property_tenancies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES profiles(id) NOT NULL,
  monthly_rent DECIMAL(12,2) NOT NULL,
  deposit DECIMAL(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT CHECK (status IN ('active', 'terminated', 'pending_termination', 'pending_approval')) DEFAULT 'pending_approval',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tenancy_id UUID REFERENCES property_tenancies(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('rent_payment', 'deposit_payment', 'termination_request', 'booking_payment')) NOT NULL,
  amount DECIMAL(12,2),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
  description TEXT NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('tinympesa', 'stripe', 'bank_transfer')),
  payment_reference TEXT,
  authorized_by UUID REFERENCES profiles(id),
  authorized_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('booking_request', 'payment_reminder', 'system_update', 'chat_message', 'tour_request')) NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create saved_properties table
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- 8. Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'file')) DEFAULT 'text',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create calendar_bookings table (for enhanced booking system)
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

-- 11. Create calendar_events table
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

-- 12. Create user_preferences table (for AI recommendations)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  budget_range JSONB NOT NULL DEFAULT '{"min": 20000, "max": 150000}',
  preferred_locations TEXT[] DEFAULT '{}',
  property_types TEXT[] DEFAULT '{}',
  must_have_amenities TEXT[] DEFAULT '{}',
  lifestyle_preferences TEXT[] DEFAULT '{}',
  commute_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Create property_views table (for tracking user behavior)
CREATE TABLE IF NOT EXISTS property_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  filters JSONB NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listingType);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_properties_location_gin ON properties USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_properties_specifications_gin ON properties USING GIN(specifications);
CREATE INDEX IF NOT EXISTS idx_properties_amenities_gin ON properties USING GIN(amenities);
CREATE INDEX IF NOT EXISTS idx_properties_terms_gin ON properties USING GIN(terms);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_properties_search_vector ON properties USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_properties_title_search ON properties USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_properties_description_search ON properties USING GIN(to_tsvector('english', description));

-- Geographic index
CREATE INDEX IF NOT EXISTS idx_properties_geolocation ON properties USING GIST(geolocation);

-- Other table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_property_tenancies_tenant_id ON property_tenancies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_tenancies_property_id ON property_tenancies(property_id);
CREATE INDEX IF NOT EXISTS idx_property_tenancies_status ON property_tenancies(status);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenancy_id ON transactions(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON saved_properties(property_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_property_id ON messages(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_calendar_bookings_property_id ON calendar_bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_tenant_id ON calendar_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_agent_id ON calendar_bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_date ON calendar_bookings(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_booking_id ON calendar_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(start_date);

CREATE INDEX IF NOT EXISTS idx_property_views_user_id ON property_views(user_id);
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON property_views(viewed_at);

-- 17. Create functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_property_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.location->>'city', '') || ' ' ||
    COALESCE(NEW.location->>'address', '') || ' ' ||
    COALESCE(NEW.location->>'region', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update geolocation from location JSONB
CREATE OR REPLACE FUNCTION update_property_geolocation()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract lat/lng from location JSONB and update geolocation
  IF NEW.location ? 'lat' AND NEW.location ? 'lng' THEN
    NEW.geolocation := ST_SetSRID(
      ST_MakePoint(
        (NEW.location->>'lng')::FLOAT,
        (NEW.location->>'lat')::FLOAT
      ),
      4326
    )::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for geographic radius search
CREATE OR REPLACE FUNCTION properties_within_radius(
  lat FLOAT,
  lng FLOAT,
  radius_km FLOAT
)
RETURNS SETOF properties AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM properties
  WHERE geolocation IS NOT NULL
    AND ST_DWithin(
      geolocation,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
    AND status = 'available';
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming appointments
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

-- Function to get property statistics
CREATE OR REPLACE FUNCTION get_property_stats()
RETURNS TABLE(
  total_properties BIGINT,
  available_properties BIGINT,
  occupied_properties BIGINT,
  avg_price NUMERIC,
  verified_agents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_properties,
    COUNT(*) FILTER (WHERE p.status = 'available') as available_properties,
    COUNT(*) FILTER (WHERE p.status = 'occupied') as occupied_properties,
    AVG(p.price) as avg_price,
    COUNT(DISTINCT p.agent_id) FILTER (WHERE pr.verified = true) as verified_agents
  FROM properties p
  LEFT JOIN profiles pr ON p.agent_id = pr.id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete old notifications (older than 6 months)
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '6 months';
  
  -- Delete old property views (older than 1 year)
  DELETE FROM property_views 
  WHERE viewed_at < NOW() - INTERVAL '1 year';
  
  -- Delete old search history (older than 6 months)
  DELETE FROM search_history 
  WHERE created_at < NOW() - INTERVAL '6 months';
  
  -- Log cleanup
  RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- 18. Create triggers

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_tenancies_updated_at BEFORE UPDATE ON property_tenancies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_bookings_updated_at BEFORE UPDATE ON calendar_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for properties
CREATE TRIGGER update_property_search_vector_trigger
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_property_search_vector();

CREATE TRIGGER update_property_geolocation_trigger
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_property_geolocation();

-- 19. Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 20. Enable Row Level Security (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 21. Create RLS Policies

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties policies
DROP POLICY IF EXISTS "Available properties are viewable by everyone" ON properties;
CREATE POLICY "Available properties are viewable by everyone" ON properties
  FOR SELECT USING (status = 'available' OR auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agents can manage own properties" ON properties;
CREATE POLICY "Agents can manage own properties" ON properties
  FOR ALL USING (auth.uid() = agent_id);

-- Property tenancies policies
DROP POLICY IF EXISTS "Users can view relevant tenancies" ON property_tenancies;
CREATE POLICY "Users can view relevant tenancies" ON property_tenancies
  FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = agent_id);

DROP POLICY IF EXISTS "Tenants can create tenancies" ON property_tenancies;
CREATE POLICY "Tenants can create tenancies" ON property_tenancies
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Agents can update tenancies" ON property_tenancies;
CREATE POLICY "Agents can update tenancies" ON property_tenancies
  FOR UPDATE USING (auth.uid() = agent_id);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Saved properties policies
DROP POLICY IF EXISTS "Users can manage own saved properties" ON saved_properties;
CREATE POLICY "Users can manage own saved properties" ON saved_properties
  FOR ALL USING (auth.uid() = user_id);

-- Saved searches policies
DROP POLICY IF EXISTS "Users can manage own saved searches" ON saved_searches;
CREATE POLICY "Users can manage own saved searches" ON saved_searches
  FOR ALL USING (auth.uid() = user_id);

-- Messages policies
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Calendar bookings policies
DROP POLICY IF EXISTS "Users can view relevant bookings" ON calendar_bookings;
CREATE POLICY "Users can view relevant bookings" ON calendar_bookings
  FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = agent_id);

DROP POLICY IF EXISTS "Tenants can create bookings" ON calendar_bookings;
CREATE POLICY "Tenants can create bookings" ON calendar_bookings
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Agents can update bookings" ON calendar_bookings;
CREATE POLICY "Agents can update bookings" ON calendar_bookings
  FOR UPDATE USING (auth.uid() = agent_id);

-- Calendar events policies
DROP POLICY IF EXISTS "Users can view own calendar events" ON calendar_events;
CREATE POLICY "Users can view own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own calendar events" ON calendar_events;
CREATE POLICY "Users can manage own calendar events" ON calendar_events
  FOR ALL USING (auth.uid() = user_id);

-- User preferences policies
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Property views policies
DROP POLICY IF EXISTS "Users can manage own property views" ON property_views;
CREATE POLICY "Users can manage own property views" ON property_views
  FOR ALL USING (auth.uid() = user_id);

-- Search history policies
DROP POLICY IF EXISTS "Users can manage own search history" ON search_history;
CREATE POLICY "Users can manage own search history" ON search_history
  FOR ALL USING (auth.uid() = user_id);

-- Notification settings policies
DROP POLICY IF EXISTS "Users can manage own notification settings" ON notification_settings;
CREATE POLICY "Users can manage own notification settings" ON notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- 22. Create helpful views
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

-- 23. Update existing records with search vectors (if any exist)
UPDATE properties SET search_vector = to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(description, '') || ' ' ||
  COALESCE(location->>'city', '') || ' ' ||
  COALESCE(location->>'address', '') || ' ' ||
  COALESCE(location->>'region', '')
) WHERE search_vector IS NULL;

-- 24. Analyze tables for better query planning
ANALYZE profiles;
ANALYZE properties;
ANALYZE property_tenancies;
ANALYZE transactions;
ANALYZE notifications;
ANALYZE saved_properties;
ANALYZE saved_searches;
ANALYZE messages;
ANALYZE calendar_bookings;
ANALYZE calendar_events;
ANALYZE user_preferences;
ANALYZE property_views;
ANALYZE search_history;
ANALYZE notification_settings;

-- 25. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Nestie database setup completed successfully!';
  RAISE NOTICE 'Tables created: profiles, properties, property_tenancies, transactions, notifications, saved_properties, saved_searches, messages, calendar_bookings, calendar_events, user_preferences, property_views, search_history, notification_settings';
  RAISE NOTICE 'Extensions enabled: PostGIS, UUID-OSSP';
  RAISE NOTICE 'Geographic search function: properties_within_radius() is ready';
  RAISE NOTICE 'Row Level Security (RLS) enabled on all tables';
  RAISE NOTICE 'Indexes created for optimal performance';
END $$;