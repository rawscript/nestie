# Nestie - Modern Real Estate Platform

Nestie is a mobile-first, ultra-modern, minimalist web application designed for real estate discovery, management, and transactions. The platform features a clean black, white, and grey color palette with a functional, elegant, and intuitive design.

## 🔷 Technologies Used

- **Frontend**: React + Next.js
- **Styling**: Tailwind CSS
- **Backend**: Supabase (authentication, database, storage, real-time)
- **Maps**: Yandex Maps API
- **Virtual Tours**: 360° viewer / WebXR-compatible viewer
- **Payments**:
  - TinyMpesa for mobile money (M-Pesa)
  - Stripe for global card payments
- **Routing**: Next.js dynamic routing

## 🚀 Features

### 🏠 Landing Page
- Minimalist design with brand intro and mission
- CTA: "Try Nestie Homes" → redirects to user dashboard
- Responsive layout optimized for mobile
- SEO-friendly and fast-loading

### 👤 User Dashboard (House Seekers)
- **Authentication**: Sign up, login, password recovery via Supabase Auth
- **Search Functionality**:
  - Input: house description + location
  - Output: animated map using Yandex Maps showing houses popping up
- **Search Results**:
  - Grid layout of image cards with short descriptions
  - Full-page house view with high-res images, agent info, location details, and virtual tour option
  - Booking and messaging functionality
- **Tenant Portal**:
  - View current rentals
  - Pay bills via TinyMpesa or Stripe
  - Request termination

### 🧑‍💼 Agent/Owner Dashboard
- **Property Management**:
  - View vacant, occupied, and sold properties
  - Add new listings with room details, images, location, and pricing
  - Invoicing and payment tracking
- **Tenant Interaction**:
  - Approve bookings, rentals, terminations
  - Messaging system with users

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account
- Yandex Maps API key
- Stripe account (for payments)
- TinyMpesa account (for M-Pesa integration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nestie.git
cd nestie
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```
Then edit `.env.local` with your API keys and configuration.

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Mobile-First Design

Nestie is built with a mobile-first approach, ensuring a seamless experience across all devices:

- Responsive layouts that adapt to any screen size
- Touch-friendly interface elements
- Optimized performance for mobile networks
- Progressive Web App capabilities

## 🔒 Security Features

- Secure authentication via Supabase Auth
- HTTPS-only communication
- Protected API routes
- Secure payment processing
- Data encryption

## 🌐 Deployment

The application can be deployed to Vercel, Netlify, or any other Next.js-compatible hosting platform.

```bash
npm run build
# or
yarn build
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Yandex Maps API](https://yandex.com/dev/maps/)
- [Stripe](https://stripe.com/)
- [Framer Motion](https://www.framer.com/motion/)