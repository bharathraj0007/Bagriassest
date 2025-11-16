#!/bin/bash

# Deploy Supabase Functions for AgriSmart
echo "🚀 Deploying AgriSmart Supabase Functions"
echo "=========================================="

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not installed."
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Check if user is logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &>/dev/null; then
    echo "❌ Not logged in to Supabase."
    echo "Please run: supabase login"
    exit 1
fi

echo "✅ Supabase authentication confirmed"

# List functions to deploy
FUNCTIONS=(
    "crop-recommendation"
    "price-prediction"
    "weather-data"
)

# Deploy each function
for func in "${FUNCTIONS[@]}"; do
    echo ""
    echo "📦 Deploying $func function..."

    # Check if function directory exists
    if [ ! -d "supabase/functions/$func" ]; then
        echo "❌ Function directory not found: supabase/functions/$func"
        continue
    fi

    # Deploy the function
    if supabase functions deploy $func; then
        echo "✅ $func deployed successfully"
    else
        echo "❌ Failed to deploy $func"
    fi
done

echo ""
echo "🎉 Function deployment completed!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo "1. Set environment variables in Supabase Dashboard → Edge Functions → Settings"
echo "2. Test the functions with the provided test script"
echo "3. Monitor function logs in Supabase Dashboard"
echo ""
echo "🔗 Test functions:"
echo "   curl -X POST \"\${SUPABASE_URL}/functions/v1/crop-recommendation\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"soil_ph\": 6.5, \"soil_type\": \"Loamy\", \"temperature\": 25}'"

echo ""
echo "   curl -X POST \"\${SUPABASE_URL}/functions/v1/price-prediction\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"crop_name\": \"Rice\", \"market_location\": \"Bangalore\"}'"

echo ""
echo "   curl \"\${SUPABASE_URL}/functions/v1/weather-data?action=weather&latitude=12.9716&longitude=77.5946\""