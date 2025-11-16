import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Free Indian Government APIs
const AGMARKNET_API_BASE = "https://agmarknet.gov.in";
const ENAM_API_BASE = "https://enam.gov.in";
const FCA_API_BASE = "https://fcainfoweb.nic.in";
const CACHE_TTL = 3600; // 1 hour cache

// Simple in-memory cache for serverless functions
const cache = new Map<string, { data: any; expires: number }>();

interface CommodityData {
  symbol: string;
  price: number;
  currency: string;
  timestamp: string;
}

interface PredictionResult {
  crop_name: string;
  current_price: number;
  predicted_price: number;
  change_percentage: number;
  confidence_level: number;
  prediction_date: string;
  market_location: string;
  historical_trend: "upward" | "downward" | "stable";
  volatility: "low" | "medium" | "high";
  seasonal_factor: number;
  price_history?: Array<{ date: string; price: number }>;
}

// Enhanced crop coverage with commodities API symbols
const CROP_COMMODITY_MAP: Record<string, string> = {
  "Rice": "RICE",
  "Wheat": "WHEAT",
  "Cotton": "COTTON",
  "Sugarcane": "SUGAR",
  "Maize": "CORN",
  "Soybean": "SOYBEAN",
  "Potato": "POTATO",
  "Tomato": "TOMATO",
  "Black Pepper": "PEPPER",
  "Cardamom": "CARDAMOM",
  "Coconut": "COCONUT",
  "Coffee": "COFFEE",
  "Tea": "TEA",
  "Turmeric": "TURMERIC",
  "Ginger": "GINGER",
  "Cashew Nut": "CASHEW",
  "Rubber": "RUBBER",
  "Finger Millet": "MILLET",
  "Pearl Millet": "PEARL_MILLET",
  "Red Gram": "RED_GRAM"
};

// Market location factors for Indian markets
const MARKET_FACTORS: Record<string, number> = {
  "Mumbai": 1.15,
  "Delhi": 1.10,
  "Bangalore": 1.12,
  "Kolkata": 1.08,
  "Chennai": 1.09,
  "Hyderabad": 1.07,
  "Pune": 1.11,
  "Kochi": 1.06,
  "Coimbatore": 1.05,
  "Madurai": 1.04,
  "Mysore": 1.03,
  "Vijayawada": 1.04,
  "Tirupati": 1.03
};

// Cache helper functions
function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any, ttl: number = CACHE_TTL): void {
  cache.set(key, { data, expires: Date.now() + (ttl * 1000) });
}

// Fetch real commodity price from Commodities API
async function fetchCommodityPrice(symbol: string): Promise<CommodityData | null> {
  try {
    const cacheKey = `commodity_${symbol}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `${COMMODITIES_API_BASE}/latest?access_key=${COMMODITIES_API_KEY}&base=USD&symbols=${symbol}`,
      {
        headers: {
          "User-Agent": "AgriculturalApp/1.0"
        }
      }
    );

    if (!response.ok) {
      console.warn(`Commodities API error for ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.rates && data.rates[symbol]) {
      const commodityData: CommodityData = {
        symbol,
        price: parseFloat(data.rates[symbol]),
        currency: "USD",
        timestamp: new Date().toISOString()
      };

      setCachedData(cacheKey, commodityData);
      return commodityData;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching commodity price for ${symbol}:`, error);
    return null;
  }
}

// Get USD to INR exchange rate
async function getExchangeRateUSDToINR(): Promise<number> {
  try {
    const cacheKey = "usd_to_inr";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    // For demo purposes, use a fixed rate. In production, use a real forex API
    const exchangeRate = 83.5; // As of late 2024
    setCachedData(cacheKey, exchangeRate, 86400); // Cache for 24 hours
    return exchangeRate;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return 83.5; // Fallback rate
  }
}

// Get historical price data for trend analysis
async function getHistoricalPrices(cropName: string, days: number = 30): Promise<Array<{ date: string; price: number }>> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("price_history")
      .select("price, price_date")
      .eq("crop_name", cropName)
      .order("price_date", { ascending: false })
      .limit(days);

    if (error) {
      console.error("Error fetching historical prices:", error);
      return [];
    }

    return data.map(item => ({
      date: item.price_date,
      price: item.price
    }));
  } catch (error) {
    console.error("Error getting historical prices:", error);
    return [];
  }
}

// Calculate trend and volatility
function calculateTrendAndVolatility(historicalPrices: Array<{ date: string; price: number }>): {
  trend: "upward" | "downward" | "stable";
  volatility: "low" | "medium" | "high";
  confidence: number;
} {
  if (historicalPrices.length < 7) {
    return { trend: "stable", volatility: "low", confidence: 0.5 };
  }

  const prices = historicalPrices.map(p => p.price);
  const firstHalf = prices.slice(Math.floor(prices.length / 2));
  const secondHalf = prices.slice(0, Math.floor(prices.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const priceChange = (secondAvg - firstAvg) / firstAvg;

  // Calculate volatility (standard deviation)
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;

  let trend: "upward" | "downward" | "stable";
  if (priceChange > 0.02) trend = "upward";
  else if (priceChange < -0.02) trend = "downward";
  else trend = "stable";

  let volatility: "low" | "medium" | "high";
  if (coefficientOfVariation < 0.05) volatility = "low";
  else if (coefficientOfVariation < 0.10) volatility = "medium";
  else volatility = "high";

  const confidence = Math.max(0.3, Math.min(0.9, 0.8 - coefficientOfVariation * 5));

  return { trend, volatility, confidence };
}

// Store current price in history
async function storePriceHistory(cropName: string, price: number, marketLocation: string): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("price_history").insert({
      crop_name: cropName,
      market_location: marketLocation,
      price: price,
      price_date: new Date().toISOString().split('T')[0],
      currency: "INR"
    });
  } catch (error) {
    console.error("Error storing price history:", error);
  }
}

// Generate advanced price prediction
function generateAdvancedPrediction(
  currentPrice: number,
  historicalTrend: "upward" | "downward" | "stable",
  volatility: "low" | "medium" | "high",
  seasonalFactor: number
): number {
  const baseChange = {
    "upward": 0.02,
    "downward": -0.015,
    "stable": 0.001
  }[historicalTrend];

  const volatilityMultiplier = {
    "low": 0.5,
    "medium": 1.0,
    "high": 2.0
  }[volatility];

  const randomVariation = (Math.random() - 0.5) * 0.04 * volatilityMultiplier;
  const totalChange = baseChange * seasonalFactor + randomVariation;

  return Math.round(currentPrice * (1 + totalChange));
}

// Get seasonal factor based on current date
function getSeasonalFactor(cropName: string): number {
  const month = new Date().getMonth() + 1; // 1-12

  // Simplified seasonal factors for major Indian crops
  const seasonalFactors: Record<string, number> = {
    "Rice": (month >= 6 && month <= 10) ? 1.05 : 0.98, // Kharif season boost
    "Wheat": (month >= 11 && month <= 3) ? 1.04 : 0.97, // Rabi season boost
    "Cotton": (month >= 7 && month <= 10) ? 1.06 : 0.96,
    "Sugarcane": 1.02, // Year-round with minor variation
    "Maize": (month >= 6 && month <= 9) ? 1.03 : 0.99,
    "Soybean": (month >= 7 && month <= 10) ? 1.05 : 0.97
  };

  return seasonalFactors[cropName] || 1.0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { crop_name, market_location } = await req.json();

    if (!crop_name) {
      return new Response(
        JSON.stringify({ error: "crop_name is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const commoditySymbol = CROP_COMMODITY_MAP[crop_name];
    if (!commoditySymbol) {
      return new Response(
        JSON.stringify({ error: `Crop "${crop_name}" not supported` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch real market data
    const [commodityData, exchangeRate, historicalPrices] = await Promise.all([
      fetchCommodityPrice(commoditySymbol),
      getExchangeRateUSDToINR(),
      getHistoricalPrices(crop_name)
    ]);

    if (!commodityData) {
      return new Response(
        JSON.stringify({ error: "Unable to fetch current market data" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Convert USD to INR and apply market factors
    const marketFactor = MARKET_FACTORS[market_location] || 1.0;
    const seasonalFactor = getSeasonalFactor(crop_name);
    const currentPrice = Math.round(commodityData.price * exchangeRate * marketFactor * seasonalFactor);

    // Analyze historical trends
    const { trend, volatility, confidence } = calculateTrendAndVolatility(historicalPrices);

    // Generate advanced prediction
    const predictedPrice = generateAdvancedPrediction(currentPrice, trend, volatility, seasonalFactor);
    const changePercentage = ((predictedPrice - currentPrice) / currentPrice) * 100;

    // Calculate prediction date (30 days from now)
    const predictionDate = new Date();
    predictionDate.setDate(predictionDate.getDate() + 30);

    // Store current price for historical analysis
    await storePriceHistory(crop_name, currentPrice, market_location || "Unknown");

    const result: PredictionResult = {
      crop_name,
      current_price: currentPrice,
      predicted_price: predictedPrice,
      change_percentage: Math.round(changePercentage * 100) / 100,
      confidence_level: Math.round(confidence * 100) / 100,
      prediction_date: predictionDate.toISOString().split('T')[0],
      market_location: market_location || "National Average",
      historical_trend: trend,
      volatility: volatility,
      seasonal_factor: Math.round(seasonalFactor * 100) / 100,
      price_history: historicalPrices.slice(0, 7).reverse() // Show last 7 days
    };

    return new Response(
      JSON.stringify({ prediction: result }),
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
      JSON.stringify({ error: error.message || "Internal server error" }),
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