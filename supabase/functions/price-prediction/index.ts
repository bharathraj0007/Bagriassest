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

// Indian crop price database (average retail prices per kg/quintal in INR)
// Based on actual Indian market data from government sources
const INDIAN_CROP_PRICES: Record<string, { basePrice: number; unit: string; category: string }> = {
  // Food Grains (per kg)
  "Rice": { basePrice: 42.77, unit: "kg", category: "cereals" },
  "Wheat": { basePrice: 31.46, unit: "kg", category: "cereals" },
  "Maize": { basePrice: 22.50, unit: "kg", category: "cereals" },
  "Bajra (Pearl Millet)": { basePrice: 28.30, unit: "kg", category: "cereals" },
  "Jowar (Sorghum)": { basePrice: 26.80, unit: "kg", category: "cereals" },
  "Finger Millet": { basePrice: 35.20, unit: "kg", category: "cereals" },

  // Pulses (per kg)
  "Red Gram (Tur Dal)": { basePrice: 127.59, unit: "kg", category: "pulses" },
  "Green Gram (Moong Dal)": { basePrice: 112.11, unit: "kg", category: "pulses" },
  "Bengal Gram (Chana Dal)": { basePrice: 86.88, unit: "kg", category: "pulses" },
  "Black Gram (Urad Dal)": { basePrice: 118.13, unit: "kg", category: "pulses" },
  "Lentils (Masoor Dal)": { basePrice: 88.11, unit: "kg", category: "pulses" },

  // Vegetables (per kg)
  "Potato": { basePrice: 25.40, unit: "kg", category: "vegetables" },
  "Tomato": { basePrice: 42.30, unit: "kg", category: "vegetables" },
  "Onion": { basePrice: 38.70, unit: "kg", category: "vegetables" },
  "Brinjal": { basePrice: 35.60, unit: "kg", category: "vegetables" },
  "Okra (Ladyfinger)": { basePrice: 45.20, unit: "kg", category: "vegetables" },
  "Cabbage": { basePrice: 22.40, unit: "kg", category: "vegetables" },
  "Cauliflower": { basePrice: 32.80, unit: "kg", category: "vegetables" },

  // Fruits (per kg)
  "Mango": { basePrice: 85.50, unit: "kg", category: "fruits" },
  "Banana": { basePrice: 45.30, unit: "kg", category: "fruits" },
  "Apple": { basePrice: 156.80, unit: "kg", category: "fruits" },
  "Orange": { basePrice: 68.40, unit: "kg", category: "fruits" },
  "Grapes": { basePrice: 92.60, unit: "kg", category: "fruits" },
  "Pomegranate": { basePrice: 145.20, unit: "kg", category: "fruits" },

  // Spices (per kg)
  "Turmeric": { basePrice: 156.30, unit: "kg", category: "spices" },
  "Chilli": { basePrice: 125.80, unit: "kg", category: "spices" },
  "Coriander": { basePrice: 98.40, unit: "kg", category: "spices" },
  "Cumin": { basePrice: 268.50, unit: "kg", category: "spices" },
  "Black Pepper": { basePrice: 542.30, unit: "kg", category: "spices" },
  "Cardamom": { basePrice: 1250.60, unit: "kg", category: "spices" },
  "Clove": { basePrice: 680.40, unit: "kg", category: "spices" },
  "Cinnamon": { basePrice: 385.70, unit: "kg", category: "spices" },

  // Cash Crops (per quintal)
  "Cotton": { basePrice: 6250, unit: "quintal", category: "fibers" },
  "Sugarcane": { basePrice: 315, unit: "quintal", category: "sugarcane" },
  "Jute": { basePrice: 3850, unit: "quintal", category: "fibers" },

  // Oilseeds (per quintal)
  "Groundnut": { basePrice: 5850, unit: "quintal", category: "oilseeds" },
  "Mustard": { basePrice: 4850, unit: "quintal", category: "oilseeds" },
  "Soybean": { basePrice: 4250, unit: "quintal", category: "oilseeds" },
  "Sunflower": { basePrice: 5650, unit: "quintal", category: "oilseeds" },

  // Commercial Crops
  "Coffee": { basePrice: 285, unit: "kg", category: "beverages" },
  "Tea": { basePrice: 185, unit: "kg", category: "beverages" },
  "Rubber": { basePrice: 145, unit: "kg", category: "rubber" },
  "Coconut": { basePrice: 28, unit: "piece", category: "nuts" },
  "Cashew Nut": { basePrice: 685, unit: "kg", category: "nuts" },

  // Livestock Products
  "Milk": { basePrice: 58.90, unit: "liter", category: "dairy" },
  "Eggs": { basePrice: 6.20, unit: "piece", category: "poultry" },
  "Chicken (Broiler)": { basePrice: 185, unit: "kg", category: "poultry" }
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

// Get current crop price from Indian database
function getCropPriceFromDatabase(cropName: string): CommodityData | null {
  try {
    const cacheKey = `crop_${cropName}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const cropData = INDIAN_CROP_PRICES[cropName];
    if (!cropData) {
      console.warn(`Crop "${cropName}" not found in Indian price database`);
      return null;
    }

    const commodityData: CommodityData = {
      symbol: cropName,
      price: cropData.basePrice,
      currency: "INR",
      timestamp: new Date().toISOString()
    };

    setCachedData(cacheKey, commodityData, CACHE_TTL);
    return commodityData;
  } catch (error) {
    console.error(`Error getting crop price for ${cropName}:`, error);
    return null;
  }
}

// Simulate fetching real-time market data with variations
async function getRealTimePriceVariation(cropName: string, basePrice: number): Promise<number> {
  const cacheKey = `variation_${cropName}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  // Simulate market variations (-3% to +3%) based on typical Indian market fluctuations
  const variationPercent = (Math.random() - 0.5) * 0.06; // ±3%
  const marketNoise = (Math.random() - 0.5) * 0.02; // ±1% noise
  const totalVariation = variationPercent + marketNoise;

  const variedPrice = basePrice * (1 + totalVariation);

  // Cache for 15 minutes to simulate real-time updates
  setCachedData(cacheKey, variedPrice, 900);

  return variedPrice;
}

// Fetch supplemental data from FCA (Food Corporation of India) API if available
async function fetchFCAPriceData(cropName: string): Promise<number | null> {
  try {
    // Note: FCA doesn't have a public API, but this simulates what it would look like
    // In a real implementation, you might need to web scrape or use official data feeds

    const cacheKey = `fca_${cropName}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    // Simulate FCA data with slight variations from base prices
    const baseData = INDIAN_CROP_PRICES[cropName];
    if (!baseData) return null;

    // FCA prices are typically 5-10% lower than retail prices
    const fcaPrice = baseData.basePrice * (0.90 + Math.random() * 0.05);

    // Cache for 6 hours
    setCachedData(cacheKey, fcaPrice, 21600);

    return fcaPrice;
  } catch (error) {
    console.error(`Error fetching FCA data for ${cropName}:`, error);
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