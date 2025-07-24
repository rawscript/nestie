# Nestie Database Schema

This document outlines the complete database schema for the Nestie real estate platform using Supabase.

## Tables

### 1. Users (auth.users - Supabase Auth)
Extended with custom profile data in `profiles` table.

### 2. Profiles
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('tenant', 'agent')) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Properties
```sql
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('rent', 'sale')) NOT NULL,
  status TEXT CHECK (status IN ('available', 'occupied', 'sold')) DEFAULT 'available',
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  area INTEGER, -- in square feet
  location JSONB NOT NULL, -- {address, lat, lng}
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  virtual_tour_url TEXT,
  agent_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Bookings
```sql
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  agent_id UUID REFERENCES profiles(id) NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Rentals
```sql
CREATE TABLE rentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) NOT NULL,
  tenant_id UUID REFERENCES profiles(id) NOT NULL,
  agent_id UUID REFERENCES profiles(id) NOT NULL,
  monthly_rent DECIMAL(12,2) NOT NULL,
  deposit DECIMAL(12,2) NOT NULL,
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'terminated', 'pending_termination')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Bills
```sql
CREATE TABLE bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_id UUID REFERENCES rentals(id) NOT NULL,
  tenant_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT CHECK (type IN ('rent', 'utilities', 'maintenance', 'deposit')) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. Payments
```sql
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID REFERENCES bills(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method TEXT CHECK (method IN ('mpesa', 'stripe')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  transaction_id TEXT UNIQUE NOT NULL,
  payment_data JSONB, -- Store payment gateway response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. Messages
```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  receiver_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'file')) DEFAULT 'text',
  read BOOLEAN DEFAULT FALSE,
  property_id UUID REFERENCES properties(id), -- Optional: if message is about a specific property
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9. Conversations
```sql
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID REFERENCES profiles(id) NOT NULL,
  participant_2 UUID REFERENCES profiles(id) NOT NULL,
  property_id UUID REFERENCES properties(id), -- Optional: if conversation is about a specific property
  last_message_id UUID REFERENCES messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1, participant_2, property_id)
);
```

## Indexes

```sql
-- Properties indexes
CREATE INDEX idx_properties_agent_id ON properties(agent_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_location ON properties USING GIN(location);

-- Bookings indexes
CREATE INDEX idx_bookings_property_id ON bookings(property_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_agent_id ON bookings(agent_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Rentals indexes
CREATE INDEX idx_rentals_property_id ON rentals(property_id);
CREATE INDEX idx_rentals_tenant_id ON rentals(tenant_id);
CREATE INDEX idx_rentals_agent_id ON rentals(agent_id);
CREATE INDEX idx_rentals_status ON rentals(status);

-- Bills indexes
CREATE INDEX idx_bills_rental_id ON bills(rental_id);
CREATE INDEX idx_bills_tenant_id ON bills(tenant_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due_date ON bills(due_date);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

## Row Level Security (RLS) Policies

### Profiles
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Properties
```sql
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Anyone can view available properties
CREATE POLICY "Available properties are viewable by everyone" ON properties
  FOR SELECT USING (status = 'available' OR auth.uid() = agent_id);

-- Only agents can insert/update their own properties
CREATE POLICY "Agents can insert own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update own properties" ON properties
  FOR UPDATE USING (auth.uid() = agent_id);
```

### Bookings
```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings, agents can view bookings for their properties
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = agent_id);

-- Users can create bookings
CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Agents can update bookings for their properties
CREATE POLICY "Agents can update property bookings" ON bookings
  FOR UPDATE USING (auth.uid() = agent_id);
```

### Messages
```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only see messages they sent or received
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
```

## Functions and Triggers

### Update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rentals_updated_at BEFORE UPDATE ON rentals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Auto-create profile on user signup
```sql
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Storage Buckets

### Property Images
```sql
-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Allow public access to view images
CREATE POLICY "Public can view property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');
```

### User Avatars
```sql
-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to view avatars
CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

## API Endpoints Structure

### Properties
- `GET /api/properties` - List properties with filters
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (agents only)
- `PUT /api/properties/:id` - Update property (agents only)
- `DELETE /api/properties/:id` - Delete property (agents only)

### Bookings
- `GET /api/bookings` - List user's bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking status (agents only)

### Payments
- `POST /api/payments/mpesa` - Process M-Pesa payment
- `POST /api/payments/stripe` - Process Stripe payment
- `GET /api/payments/:id` - Get payment details

### Messages
- `GET /api/conversations` - List user's conversations
- `GET /api/conversations/:id/messages` - Get conversation messages
- `POST /api/messages` - Send message

This schema provides a solid foundation for the Nestie platform with proper relationships, security, and scalability considerations.