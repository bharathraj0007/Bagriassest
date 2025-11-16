# Supabase Setup Guide for AgriSmart

This guide will help you connect the AgriSmart backend to your Supabase project.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" or sign in
3. Create a new organization (if you don't have one)
4. Create a new project:
   - **Project Name**: `agri-smart` (or your preferred name)
   - **Database Password**: Create a strong password (save it securely)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Start with Free Tier

### 2. Get Project Configuration

Once your project is created, go to **Settings** → **API** to get your credentials:

**Project URL**: `https://[your-project-id].supabase.co`
**Anon Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
**Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: For admin functions
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 🗄️ Database Setup

### 4. Run Database Migrations

Copy and run the SQL migration files in your Supabase SQL Editor:

#### Migration 1: Agricultural System Schema
**File**: `supabase/migrations/20251104085826_create_agricultural_system_schema.sql`

Go to **SQL Editor** in Supabase Dashboard → paste and run this SQL.

#### Migration 2: Backend Enhancement Tables
**File**: `supabase/migrations/20251116085826_backend_enhancement_tables.sql`

This creates:
- `price_history` table for historical price data
- `weather_cache` table for caching weather data
- `system_logs` table for logging
- `market_data` table for real-time market information

#### Migration 3: South Indian Crops Data
**File**: `supabase/migrations/20251116085926_south_indian_crops_data.sql`

This adds 20+ South Indian crops with detailed growing parameters.

### 5. Enable Row Level Security (RLS)

All tables have RLS enabled with appropriate policies. You can modify these in **Authentication** → **Policies**.

## 🔧 Backend Functions Setup

### 6. Deploy Supabase Functions

#### Method 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-id
```

4. Deploy functions:
```bash
supabase functions deploy crop-recommendation
supabase functions deploy price-prediction
supabase functions deploy weather-data
```

#### Method 2: Using Dashboard

1. Go to **Edge Functions** in Supabase Dashboard
2. Create new functions:

**crop-recommendation**:
```typescript
// Copy from: supabase/functions/crop-recommendation/index.ts
```

**price-prediction**:
```typescript
// Copy from: supabase/functions/price-prediction/index.ts
```

**weather-data**:
```typescript
// Copy from: supabase/functions/weather-data/index.ts
```

### 7. Set Environment Variables for Functions

In **Edge Functions** → **Settings**, add these environment variables:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# For Weather Data (optional)
WAQI_API_KEY=your-waqi-api-key

# Note: Price prediction now uses FREE Indian government databases
# No API key required for pricing - uses AGMARKNET, e-NAM, FCI data
```

## 🔌 API Keys Setup

### 8. Get Required API Keys

#### Commodities API (for price prediction)
1. Sign up at [commodities-api.com](https://commodities-api.com)
2. Get your API key
3. Add to Supabase function environment variables

#### WAQI API (for air quality data)
1. Sign up at [aqicn.org](https://aqicn.org/data-platform/token/)
2. Get your API key
3. Add to Supabase function environment variables

## 🏗️ Database Schema Overview

### Tables Created:

1. **profiles** - User profiles with farm details
2. **crops** - Crop database with growing parameters
3. **recommendations** - User crop recommendations
4. **price_predictions** - Price prediction history
5. **government_schemes** - Agricultural government schemes
6. **support_tickets** - Customer support tickets
7. **price_history** - Historical commodity prices
8. **weather_cache** - Cached weather data
9. **system_logs** - System activity logs
10. **market_data** - Real-time market data

### Relationships:
- `profiles` → `recommendations` (one-to-many)
- `profiles` → `price_predictions` (one-to-many)
- `profiles` → `support_tickets` (one-to-many)

## 🧪 Test the Connection

### 9. Test Frontend Connection

Start your development server:
```bash
npm run dev
```

Test the application:
1. Open your browser to `http://localhost:5173`
2. Try registering a new user
3. Test crop recommendations
4. Test price predictions
5. Check browser console for any errors

### 10. Test Backend Functions

Test each API endpoint:

**Crop Recommendation:**
```bash
curl -X POST "https://your-project-id.supabase.co/functions/v1/crop-recommendation" \
  -H "Content-Type: application/json" \
  -d '{
    "soil_ph": 6.5,
    "soil_type": "Loamy",
    "temperature": 25,
    "humidity": 70,
    "air_quality": 75,
    "rainfall": 1200,
    "season": "Kharif"
  }'
```

**Price Prediction:**
```bash
curl -X POST "https://your-project-id.supabase.co/functions/v1/price-prediction" \
  -H "Content-Type: application/json" \
  -d '{
    "crop_name": "Rice",
    "market_location": "Bangalore"
  }'
```

**Weather Data:**
```bash
curl "https://your-project-id.supabase.co/functions/v1/weather-data?action=weather&latitude=12.9716&longitude=77.5946"
```

## 🔍 Troubleshooting

### Common Issues:

#### 1. CORS Errors
- Make sure your URL is added to CORS origins in Supabase
- Check that `Access-Control-Allow-Origin` headers are properly set

#### 2. Authentication Errors
- Verify API keys are correctly set
- Check RLS policies on tables
- Ensure user authentication is working

#### 3. Function Deployment Issues
- Check function logs in Supabase Dashboard
- Verify environment variables are set
- Ensure all dependencies are installed

#### 4. Database Connection Issues
- Verify database URL is correct
- Check service role key permissions
- Ensure tables exist

### Debug Tools:

1. **Browser Console**: Check for JavaScript errors
2. **Network Tab**: Monitor API requests
3. **Supabase Logs**: View function execution logs
4. **Database Logs**: Check database operations

## 🚀 Next Steps

Once connected, you can:

1. **Test all features** in the application
2. **Monitor system performance** using the admin dashboard
3. **Add custom crops** to the database
4. **Configure additional API keys** as needed
5. **Set up monitoring and alerts**

## 📞 Support

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review function logs in Supabase Dashboard
3. Verify all environment variables are set correctly
4. Test with a simple API call first

---

**Note**: Keep your API keys secure and never commit them to version control. Use environment variables for all sensitive configuration.