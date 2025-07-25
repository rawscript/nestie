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

-- 18. Create a scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT cleanup_old_data();');

COMMIT;