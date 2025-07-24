export interface Property {
  id: string
  title: string
  description: string
  price: number
  type: 'rent' | 'sale'
  status: 'available' | 'occupied' | 'sold'
  bedrooms: number
  bathrooms: number
  area: number
  location: {
    address: string
    lat: number
    lng: number
  }
  images: string[]
  agent_id: string
  created_at: string
  features?: string[]
}

export const sampleProperties: Property[] = [
  {
    id: '1',
    title: 'Modern 2BR Apartment in Westlands',
    description: 'Beautiful modern apartment with city views, fully furnished with contemporary amenities. Located in the heart of Westlands with easy access to shopping malls and restaurants.',
    price: 85000,
    type: 'rent',
    status: 'available',
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    location: {
      address: 'Westlands, Nairobi',
      lat: -1.2676,
      lng: 36.8108
    },
    images: ['/api/placeholder/400/300'],
    agent_id: 'agent1',
    created_at: '2024-01-15',
    features: ['Furnished', 'Parking', 'Security', 'Gym', 'Swimming Pool']
  },
  {
    id: '2',
    title: 'Luxury 4BR Villa in Karen',
    description: 'Spacious villa with beautiful garden and swimming pool. Perfect for families looking for luxury living in a serene environment.',
    price: 12000000,
    type: 'sale',
    status: 'available',
    bedrooms: 4,
    bathrooms: 3,
    area: 2500,
    location: {
      address: 'Karen, Nairobi',
      lat: -1.3194,
      lng: 36.7085
    },
    images: ['/api/placeholder/400/300'],
    agent_id: 'agent2',
    created_at: '2024-01-10',
    features: ['Garden', 'Swimming Pool', 'Garage', 'Security', 'Fireplace']
  },
  {
    id: '3',
    title: 'Cozy 1BR Studio in Kilimani',
    description: 'Perfect starter home for young professionals. Modern finishes with great natural lighting and close to public transport.',
    price: 45000,
    type: 'rent',
    status: 'available',
    bedrooms: 1,
    bathrooms: 1,
    area: 650,
    location: {
      address: 'Kilimani, Nairobi',
      lat: -1.2921,
      lng: 36.7856
    },
    images: ['/api/placeholder/400/300'],
    agent_id: 'agent1',
    created_at: '2024-01-20',
    features: ['Furnished', 'WiFi', 'Security', 'Backup Generator']
  },
  {
    id: '4',
    title: 'Executive 3BR Townhouse in Lavington',
    description: 'Elegant townhouse in a gated community with modern amenities. Features include a private garden and dedicated parking.',
    price: 120000,
    type: 'rent',
    status: 'occupied',
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    location: {
      address: 'Lavington, Nairobi',
      lat: -1.2833,
      lng: 36.7667
    },
    images: ['/api/placeholder/400/300'],
    agent_id: 'agent3',
    created_at: '2024-01-05',
    features: ['Gated Community', 'Garden', 'Parking', 'Security', 'Playground']
  },
  {
    id: '5',
    title: 'Penthouse Apartment in Upper Hill',
    description: 'Stunning penthouse with panoramic city views. Features include a private terrace and premium finishes throughout.',
    price: 8500000,
    type: 'sale',
    status: 'available',
    bedrooms: 3,
    bathrooms: 3,
    area: 2000,
    location: {
      address: 'Upper Hill, Nairobi',
      lat: -1.2921,
      lng: 36.8219
    },
    images: ['/api/placeholder/400/300'],
    agent_id: 'agent2',
    created_at: '2024-01-12',
    features: ['City Views', 'Terrace', 'Elevator', 'Gym', 'Concierge']
  },
  {
    id: '6',
    title: 'Family Home in Runda',
    description: 'Spacious family home in the prestigious Runda estate. Features large compound, mature gardens, and excellent security.',
    price: 18000000,
    type: 'sale',
    status: 'available',
    bedrooms: 5,
    bathrooms: 4,
    area: 3500,
    location: {
      address: 'Runda, Nairobi',
      lat: -1.2167,
      lng: 36.7833
    },
    images: ['/api/placeholder/400/300'],
    agent_id: 'agent3',
    created_at: '2024-01-08',
    features: ['Large Compound', 'Mature Garden', 'Staff Quarters', 'Security', 'Garage']
  },
  {
    id: '7',
    title: 'Modern 2BR in Kileleshwa',
    description: 'Contemporary apartment with modern amenities in a quiet neighborhood. Perfect for young professionals and small families.',
    price: 75000,
    type: 'rent',
    status: 'available',
    bedrooms: 2,
    bathrooms: 2,
    area: 1100,
    location: {
      address: 'Kileleshwa, Nairobi',
      lat: -1.2833,
      lng: 36.7833
    },
    images: ['/api/placeholder/400/300'],
    agent_id: 'agent1',
    created_at: '2024-01-18',
    features: ['Modern Kitchen', 'Balcony', 'Parking', 'Security', 'Backup Power']
  },
  {
    id: '8',
    title: 'Beachfront Villa in Diani',
    description: 'Stunning beachfront property with direct beach access. Perfect for vacation rental or permanent residence by the ocean.',
    price: 25000000,
    type: 'sale',
    status: 'available',
    bedrooms: 4,
    bathrooms: 4,
    area: 3000,
    location: {
      address: 'Diani Beach, Kwale',
      lat: -4.3297,
      lng: 39.5772
    },
    images: ['/api/placeholder/400/300'],
    agent_id: 'agent2',
    created_at: '2024-01-03',
    features: ['Beach Access', 'Ocean Views', 'Swimming Pool', 'Garden', 'Security']
  },
  {
    id: '9',
    title: 'Student Accommodation in Kikuyu',
    description: 'Affordable housing perfect for students and young professionals. Close to universities and with good transport links.',
    price: 25000,
    type: 'rent',
    status: 'available',
    bedrooms: 1,
    bathrooms: 1,
    area: 400,
    location: {
      address: 'Kikuyu, Kiambu',
      lat: -1.2467,
      lng: 36.6667
    },
    images: ['/api/placeholder/400/300'],
    agent_id: 'agent3',
    created_at: '2024-01-22',
    features: ['Affordable', 'Near University', 'Public Transport', 'Security']
  },
  {
    id: '10',
    title: 'Commercial Office Space in CBD',
    description: 'Prime office space in Nairobi CBD with excellent connectivity and modern facilities. Perfect for businesses of all sizes.',
    price: 150000,
    type: 'rent',
    status: 'available',
    bedrooms: 0,
    bathrooms: 2,
    area: 1500,
    location: {
      address: 'CBD, Nairobi',
      lat: -1.2864,
      lng: 36.8172
    },
    images: ['/api/placeholder/400/300'],
    agent_id: 'agent1',
    created_at: '2024-01-14',
    features: ['Prime Location', 'Elevator', 'Parking', 'Security', 'Conference Room']
  }
]

export interface Booking {
  id: string
  property_id: string
  user_name: string
  user_email: string
  user_phone: string
  status: 'pending' | 'approved' | 'rejected'
  visit_date: string
  message: string
  created_at: string
}

export const sampleBookings: Booking[] = [
  {
    id: '1',
    property_id: '2',
    user_name: 'John Doe',
    user_email: 'john@example.com',
    user_phone: '+254712345678',
    status: 'pending',
    visit_date: '2024-02-15',
    message: 'Interested in viewing this property this weekend. I am looking for a family home in Karen.',
    created_at: '2024-01-20'
  },
  {
    id: '2',
    property_id: '1',
    user_name: 'Jane Smith',
    user_email: 'jane@example.com',
    user_phone: '+254723456789',
    status: 'approved',
    visit_date: '2024-02-12',
    message: 'Would like to schedule a viewing for the Westlands apartment. Available weekday evenings.',
    created_at: '2024-01-18'
  },
  {
    id: '3',
    property_id: '5',
    user_name: 'Michael Johnson',
    user_email: 'michael@example.com',
    user_phone: '+254734567890',
    status: 'pending',
    visit_date: '2024-02-20',
    message: 'Very interested in the penthouse. Can we arrange a viewing next week?',
    created_at: '2024-01-22'
  }
]

export interface Agent {
  id: string
  name: string
  email: string
  phone: string
  company: string
  avatar?: string
  properties_count: number
  rating: number
}

export const sampleAgents: Agent[] = [
  {
    id: 'agent1',
    name: 'Sarah Wanjiku',
    email: 'sarah@nestie.com',
    phone: '+254701234567',
    company: 'Nestie Properties',
    properties_count: 15,
    rating: 4.8
  },
  {
    id: 'agent2',
    name: 'David Kimani',
    email: 'david@luxurykenya.com',
    phone: '+254702345678',
    company: 'Luxury Kenya Homes',
    properties_count: 23,
    rating: 4.9
  },
  {
    id: 'agent3',
    name: 'Grace Muthoni',
    email: 'grace@familyhomes.co.ke',
    phone: '+254703456789',
    company: 'Family Homes Kenya',
    properties_count: 18,
    rating: 4.7
  }
]