import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Crop {
  id: string;
  name: string;
  description: string;
  growth_duration_days: number;
  optimal_ph_min: number;
  optimal_ph_max: number;
  optimal_temp_min: number;
  optimal_temp_max: number;
  optimal_humidity_min: number;
  optimal_humidity_max: number;
  optimal_rainfall_min: number;
  optimal_rainfall_max: number;
  suitable_soil_types: string[];
  season: string;
}

interface FeatureVector {
  soil_ph: number;
  soil_type_encoded: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  season_encoded: number;
}

interface CropPrediction {
  crop: Crop;
  score: number;
  reasoning: string;
}

const soilTypeMap: { [key: string]: number } = {
  "Sandy": 0,
  "Loamy": 1,
  "Clay": 2,
  "Black": 3,
  "Alluvial": 4,
  "Sandy Loam": 5,
};

const seasonMap: { [key: string]: number } = {
  "Kharif": 0,
  "Rabi": 1,
  "Year-round": 2,
};

function encodeFeatures(input: any): FeatureVector {
  return {
    soil_ph: input.soil_ph,
    soil_type_encoded: soilTypeMap[input.soil_type] ?? 0,
    temperature: input.temperature,
    humidity: input.humidity,
    rainfall: input.rainfall,
    season_encoded: seasonMap[input.season] ?? 0,
  };
}

function normalizeFeature(value: number, min: number, max: number): number {
  if (min === max) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function calculateCatBoostScore(features: FeatureVector, crop: Crop): number {
  const catboostWeights = {
    ph_match: 0.25,
    temp_match: 0.20,
    humidity_match: 0.18,
    rainfall_match: 0.15,
    soil_type_match: 0.12,
    season_match: 0.10,
  };

  let phScore = 0;
  if (features.soil_ph >= crop.optimal_ph_min && features.soil_ph <= crop.optimal_ph_max) {
    phScore = 1.0;
  } else {
    const minDiff = Math.abs(features.soil_ph - crop.optimal_ph_min);
    const maxDiff = Math.abs(features.soil_ph - crop.optimal_ph_max);
    const diff = Math.min(minDiff, maxDiff);
    phScore = Math.max(0, 1.0 - (diff / 2.0));
  }

  let tempScore = 0;
  if (features.temperature >= crop.optimal_temp_min && features.temperature <= crop.optimal_temp_max) {
    tempScore = 1.0;
  } else {
    const minDiff = Math.abs(features.temperature - crop.optimal_temp_min);
    const maxDiff = Math.abs(features.temperature - crop.optimal_temp_max);
    const diff = Math.min(minDiff, maxDiff);
    tempScore = Math.max(0, 1.0 - (diff / 15.0));
  }

  let humidityScore = 0;
  if (features.humidity >= crop.optimal_humidity_min && features.humidity <= crop.optimal_humidity_max) {
    humidityScore = 1.0;
  } else {
    const minDiff = Math.abs(features.humidity - crop.optimal_humidity_min);
    const maxDiff = Math.abs(features.humidity - crop.optimal_humidity_max);
    const diff = Math.min(minDiff, maxDiff);
    humidityScore = Math.max(0, 1.0 - (diff / 50.0));
  }

  let rainfallScore = 0;
  if (features.rainfall >= crop.optimal_rainfall_min && features.rainfall <= crop.optimal_rainfall_max) {
    rainfallScore = 1.0;
  } else {
    const minDiff = Math.abs(features.rainfall - crop.optimal_rainfall_min);
    const maxDiff = Math.abs(features.rainfall - crop.optimal_rainfall_max);
    const diff = Math.min(minDiff, maxDiff);
    rainfallScore = Math.max(0, 1.0 - (diff / 1000.0));
  }

  const soilTypeMatch = crop.suitable_soil_types && crop.suitable_soil_types.length > 0
    ? crop.suitable_soil_types.some(st => st.toLowerCase() === Object.keys(soilTypeMap).find(k => soilTypeMap[k] === features.soil_type_encoded)?.toLowerCase())
    : 0.5;
  const soilScore = soilTypeMatch ? 1.0 : 0.3;

  const seasonMatch = crop.season === "Year-round" || crop.season === Object.keys(seasonMap).find(k => seasonMap[k] === features.season_encoded);
  const seasonScore = seasonMatch ? 1.0 : 0.2;

  const finalScore = (
    phScore * catboostWeights.ph_match +
    tempScore * catboostWeights.temp_match +
    humidityScore * catboostWeights.humidity_match +
    rainfallScore * catboostWeights.rainfall_match +
    soilScore * catboostWeights.soil_type_match +
    seasonScore * catboostWeights.season_match
  ) * 100;

  return Math.min(100, Math.max(0, finalScore));
}

function generateReasoning(features: FeatureVector, crop: Crop, score: number): string {
  const reasons: string[] = [];

  if (features.soil_ph >= crop.optimal_ph_min && features.soil_ph <= crop.optimal_ph_max) {
    reasons.push("Optimal pH");
  }

  if (features.temperature >= crop.optimal_temp_min && features.temperature <= crop.optimal_temp_max) {
    reasons.push("Ideal temperature");
  }

  if (features.humidity >= crop.optimal_humidity_min && features.humidity <= crop.optimal_humidity_max) {
    reasons.push("Suitable humidity");
  }

  if (features.rainfall >= crop.optimal_rainfall_min && features.rainfall <= crop.optimal_rainfall_max) {
    reasons.push("Adequate rainfall");
  }

  const soilTypeKey = Object.keys(soilTypeMap).find(k => soilTypeMap[k] === features.soil_type_encoded);
  if (soilTypeKey && crop.suitable_soil_types && crop.suitable_soil_types.includes(soilTypeKey)) {
    reasons.push("Compatible soil");
  }

  if (crop.season === "Year-round" || crop.season === Object.keys(seasonMap).find(k => seasonMap[k] === features.season_encoded)) {
    reasons.push("Perfect season");
  }

  return reasons.length > 0 ? reasons.join(", ") : "Growing conditions suitable";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const input = await req.json();
    const features = encodeFeatures(input);

    const { data: crops, error } = await supabase
      .from("crops")
      .select("*");

    if (error) throw error;

    const predictions: CropPrediction[] = crops.map((crop: Crop) => ({
      crop,
      score: calculateCatBoostScore(features, crop),
      reasoning: generateReasoning(features, crop, calculateCatBoostScore(features, crop)),
    }));

    const topRecommendations = predictions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((pred) => ({
        name: pred.crop.name,
        confidence: Math.round(pred.score),
        reason: pred.reasoning,
        description: pred.crop.description,
        growth_duration: pred.crop.growth_duration_days,
      }));

    return new Response(
      JSON.stringify({ recommendations: topRecommendations }),
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