#!/bin/bash

# Supabase Setup Script for AgriSmart
# This script helps you set up Supabase connection

echo "🚀 AgriSmart Supabase Setup Script"
echo "======================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local file"
    echo ""
    echo "⚠️  Please update .env.local with your Supabase credentials:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo "   - VITE_SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "   Get these from: Settings → API in your Supabase dashboard"
    echo ""
else
    echo "✅ .env.local file already exists"
fi

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if dependencies installed successfully
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI is installed"
    echo ""
    echo "💡 To deploy functions, run:"
    echo "   supabase login"
    echo "   supabase link --project-ref your-project-id"
    echo "   supabase functions deploy crop-recommendation"
    echo "   supabase functions deploy price-prediction"
    echo "   supabase functions deploy weather-data"
else
    echo "⚠️  Supabase CLI not installed"
    echo "   Install with: npm install -g supabase"
fi

echo ""
echo "🔗 Supabase Setup Complete!"
echo "=========================="
echo ""
echo "📋 Next Steps:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Get your API keys from Settings → API"
echo "3. Update .env.local with your credentials"
echo "4. Run the SQL migrations in Supabase Dashboard:"
echo "   - supabase/migrations/20251104085826_create_agricultural_system_schema.sql"
echo "   - supabase/migrations/20251116085826_backend_enhancement_tables.sql"
echo "   - supabase/migrations/20251116085926_south_indian_crops_data.sql"
echo "5. Deploy the edge functions"
echo "6. Set up environment variables for the functions"
echo "7. Start the development server: npm run dev"
echo ""
echo "📚 For detailed instructions, see: SUPABASE_SETUP.md"
echo ""

# Check if user wants to start development server
read -p "🚀 Do you want to start the development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌟 Starting development server..."
    npm run dev
else
    echo "💡 Run 'npm run dev' to start the development server when ready"
fi