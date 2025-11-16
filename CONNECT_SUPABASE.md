# 🚀 Connect AgriSmart to Your Supabase Project

This quick guide will help you connect the AgriSmart agricultural recommendation system to your Supabase project in minutes.

## ⚡ Quick Start

### 1. One-Command Setup (Recommended)
```bash
npm run setup-supabase
```
This script will:
- Install all dependencies
- Create environment files
- Guide you through Supabase setup

### 2. Manual Setup

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Create Environment File
```bash
cp .env.example .env.local
```

#### Step 3: Configure Supabase
Edit `.env.local` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Step 4: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your API keys from **Settings** → **API**
4. Update `.env.local` with your credentials

## 🗄️ Database Setup

### Required Tables
Run these SQL migrations in your Supabase Dashboard → **SQL Editor**:

1. **Main Schema** (Required)
```sql
-- File: supabase/migrations/20251104085826_create_agricultural_system_schema.sql
```

2. **Enhanced Tables** (Recommended)
```sql
-- File: supabase/migrations/20251116085826_backend_enhancement_tables.sql
```

3. **Crop Data** (Recommended)
```sql
-- File: supabase/migrations/20251116085926_south_indian_crops_data.sql
```

## 🔌 Backend Functions

### Deploy Functions

#### Option 1: Automatic Deployment
```bash
npm run deploy-functions
```

#### Option 2: Manual Deployment
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link your project
supabase login
supabase link --project-ref your-project-id

# Deploy each function
supabase functions deploy crop-recommendation
supabase functions deploy price-prediction
supabase functions deploy weather-data
```

### Configure Function Environment Variables

In **Edge Functions** → **Settings**, add:
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional API Keys
COMMODITIES_API_KEY=your-commodities-key
WAQI_API_KEY=your-waqi-key
```

## 🧪 Test Connection

### Frontend Test
```bash
npm run test-connection
```

### Backend Test (Manual)
```bash
# Test crop recommendation
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

# Test price prediction
curl -X POST "https://your-project-id.supabase.co/functions/v1/price-prediction" \
  -H "Content-Type: application/json" \
  -d '{
    "crop_name": "Rice",
    "market_location": "Bangalore"
  }'
```

## 🎯 Verify Setup

Start your application:
```bash
npm run dev
```

Open http://localhost:5173 and test:
- ✅ User registration/login
- ✅ Crop recommendations
- ✅ Price predictions
- ✅ Government schemes
- ✅ Support tickets
- ✅ Admin dashboard

## 🔍 Troubleshooting

### Common Issues

#### ❌ "supabaseUrl is not defined"
**Solution**: Check your `.env.local` file and ensure VITE_SUPABASE_URL is set correctly.

#### ❌ "No rows found" errors
**Solution**: Run the SQL migrations in Supabase Dashboard.

#### ❌ Function not found
**Solution**: Deploy the edge functions using the deployment script.

#### ❌ CORS errors
**Solution**: Ensure your local development URL is added to CORS settings in Supabase.

### Getting Help

1. **Check Connection Status**: Use the connection test component
2. **Review Logs**: Check browser console and Supabase function logs
3. **Run Tests**: `npm run test-connection`
4. **Follow Guide**: Read `SUPABASE_SETUP.md` for detailed instructions

## 📋 Environment Variables Reference

### Required Variables
```env
VITE_SUPABASE_URL=          # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=       # Your anon key from Settings→API
```

### Optional Variables
```env
VITE_SUPABASE_SERVICE_ROLE_KEY=  # Service role key (for admin functions)
VITE_COMMODITIES_API_KEY=        # Commodities API key (for prices)
VITE_WAQI_API_KEY=              # AQI API key (for air quality)
```

## 🚀 Next Steps

Once connected:

1. **Test All Features**: Verify each application feature works
2. **Admin Setup**: Create admin users and test dashboard
3. **Customization**: Add your own crops and government schemes
4. **Monitoring**: Set up error tracking and monitoring
5. **Deployment**: Deploy to production when ready

## 📞 Support

- **Documentation**: See `SUPABASE_SETUP.md` for detailed guide
- **Issues**: Check browser console and Supabase logs
- **Community**: Visit Supabase Discord and GitHub discussions

---

**🎉 Your AgriSmart system is ready to connect to Supabase!**