import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { crop_name, market_location } = await req.json();

    const basePrices: Record<string, number> = {
      "Rice": 2500,
      "Wheat": 2200,
      "Cotton": 6000,
      "Sugarcane": 3000,
      "Maize": 1800,
      "Soybean": 4500,
      "Potato": 1200,
      "Tomato": 2000,
    };

    const basePrice = basePrices[crop_name] || 2000;

    const marketFactors: Record<string, number> = {
      "Mumbai": 1.15,
      "Delhi": 1.10,
      "Bangalore": 1.12,
      "Kolkata": 1.08,
      "Chennai": 1.09,
      "Hyderabad": 1.07,
      "Pune": 1.11,
    };

    const marketFactor = marketFactors[market_location] || 1.0;

    const seasonalVariation = (Math.random() * 0.2) - 0.1;
    const demandFactor = 1 + seasonalVariation;

    const currentPrice = Math.round(basePrice * marketFactor * (0.95 + Math.random() * 0.1));

    const trendFactor = -0.05 + Math.random() * 0.15;
    const predictedPrice = Math.round(currentPrice * (1 + trendFactor));

    const changePercentage = ((predictedPrice - currentPrice) / currentPrice) * 100;

    const today = new Date();
    const predictionDate = new Date(today);
    predictionDate.setDate(predictionDate.getDate() + 30);

    const prediction = {
      crop_name,
      current_price: currentPrice,
      predicted_price: predictedPrice,
      change_percentage: changePercentage,
      prediction_date: predictionDate.toISOString().split('T')[0],
      market_location,
    };

    return new Response(
      JSON.stringify({ prediction }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});