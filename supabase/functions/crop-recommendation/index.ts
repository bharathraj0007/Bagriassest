import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CropScore {
  name: string;
  score: number;
  reason: string;
  description: string;
  growth_duration: number;
}

interface InputData {
  soil_ph: number;
  soil_type: string;
  temperature: number;
  humidity: number;
  air_quality: number;
  rainfall: number;
  season: string;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function normalizeValue(value: number, min: number, max: number): number {
  return (value - min) / (max - min);
}

function calculateGaussianScore(value: number, optimalMin: number, optimalMax: number, width: number = 2): number {
  const optimalMid = (optimalMin + optimalMax) / 2;
  const optimalRange = optimalMax - optimalMin;

  if (value >= optimalMin && value <= optimalMax) {
    return 1.0;
  }

  const distance = value < optimalMin
    ? Math.abs(value - optimalMin)
    : Math.abs(value - optimalMax);

  const normalizedDistance = distance / (optimalRange / 2);
  const gaussianScore = Math.exp(-Math.pow(normalizedDistance, 2) / width);

  return gaussianScore;
}

function calculateAirQualityImpact(aqi: number): number {
  if (aqi <= 50) return 1.0;
  if (aqi <= 100) return 0.95;
  if (aqi <= 150) return 0.85;
  if (aqi <= 200) return 0.70;
  if (aqi <= 300) return 0.50;
  return 0.30;
}

function calculateNeuralNetworkScore(input: InputData, crop: any): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let weights = {
    ph: 0.20,
    soil_type: 0.18,
    temperature: 0.22,
    humidity: 0.15,
    rainfall: 0.20,
    season: 0.05
  };

  let phScore = calculateGaussianScore(input.soil_ph, crop.optimal_ph_min, crop.optimal_ph_max, 1.5);

  if (phScore >= 0.95) {
    reasons.push("Optimal pH range");
  } else if (phScore >= 0.7) {
    reasons.push("Acceptable pH range");
  } else if (phScore >= 0.4) {
    reasons.push("Marginal pH compatibility");
  }

  let soilTypeScore = 0;
  if (crop.suitable_soil_types && crop.suitable_soil_types.includes(input.soil_type)) {
    soilTypeScore = 1.0;
    reasons.push("Ideal soil type");
  } else if (crop.suitable_soil_types && crop.suitable_soil_types.length > 0) {
    const soilSimilarity = calculateSoilSimilarity(input.soil_type, crop.suitable_soil_types);
    soilTypeScore = soilSimilarity;
    if (soilSimilarity > 0.5) {
      reasons.push("Compatible soil type");
    }
  }

  let tempScore = calculateGaussianScore(input.temperature, crop.optimal_temp_min, crop.optimal_temp_max, 2.0);

  if (tempScore >= 0.95) {
    reasons.push("Perfect temperature");
  } else if (tempScore >= 0.7) {
    reasons.push("Suitable temperature");
  } else if (tempScore >= 0.4) {
    reasons.push("Manageable temperature");
  }

  let humidityScore = calculateGaussianScore(input.humidity, crop.optimal_humidity_min, crop.optimal_humidity_max, 2.0);

  if (humidityScore >= 0.95) {
    reasons.push("Ideal humidity");
  } else if (humidityScore >= 0.7) {
    reasons.push("Good humidity level");
  }

  let rainfallScore = calculateGaussianScore(input.rainfall, crop.optimal_rainfall_min, crop.optimal_rainfall_max, 2.5);

  if (rainfallScore >= 0.95) {
    reasons.push("Optimal rainfall");
  } else if (rainfallScore >= 0.7) {
    reasons.push("Adequate rainfall");
  } else if (rainfallScore >= 0.4) {
    reasons.push("Requires irrigation support");
  }

  let seasonScore = 0;
  if (crop.season === input.season) {
    seasonScore = 1.0;
    reasons.push("Perfect season");
  } else if (crop.season === "Year-round") {
    seasonScore = 0.9;
    reasons.push("Year-round crop");
  } else {
    seasonScore = 0.3;
  }

  let rawScore =
    weights.ph * phScore +
    weights.soil_type * soilTypeScore +
    weights.temperature * tempScore +
    weights.humidity * humidityScore +
    weights.rainfall * rainfallScore +
    weights.season * seasonScore;

  const airQualityFactor = calculateAirQualityImpact(input.air_quality);
  rawScore *= airQualityFactor;

  if (airQualityFactor < 0.9) {
    reasons.push(`Air quality impact: ${Math.round(airQualityFactor * 100)}%`);
  }

  const normalizedScore = sigmoid((rawScore - 0.5) * 8) * 100;

  const synergy = calculateSynergy(phScore, soilTypeScore, tempScore, humidityScore, rainfallScore, seasonScore);
  const finalScore = Math.min(100, normalizedScore * (0.85 + synergy * 0.15));

  if (reasons.length === 0) {
    reasons.push("Challenging growing conditions");
  }

  return { score: finalScore, reasons };
}

function calculateSoilSimilarity(inputSoil: string, suitableSoils: string[]): number {
  const soilCompatibility: Record<string, string[]> = {
    "Clay": ["Black", "Alluvial"],
    "Sandy": ["Sandy Loam"],
    "Loamy": ["Sandy Loam", "Alluvial"],
    "Black": ["Clay", "Alluvial"],
    "Alluvial": ["Loamy", "Black", "Clay"],
    "Sandy Loam": ["Loamy", "Sandy"]
  };

  for (const suitable of suitableSoils) {
    const compatible = soilCompatibility[suitable] || [];
    if (compatible.includes(inputSoil)) {
      return 0.7;
    }
  }

  return 0.3;
}

function calculateSynergy(...scores: number[]): number {
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  const consistency = 1 - Math.min(stdDev, 0.5);

  return consistency;
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

    const inputData: InputData = await req.json();

    const { data: crops, error } = await supabase
      .from("crops")
      .select("*");

    if (error) throw error;

    if (!crops || crops.length === 0) {
      throw new Error("No crops found in database");
    }

    const scoredCrops: CropScore[] = crops.map((crop: any) => {
      const { score, reasons } = calculateNeuralNetworkScore(inputData, crop);

      return {
        name: crop.name,
        score: Math.round(score * 100) / 100,
        reason: reasons.join(", "),
        description: crop.description || "Agricultural crop",
        growth_duration: crop.growth_duration_days || 90,
      };
    });

    const topRecommendations = scoredCrops
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((crop) => ({
        name: crop.name,
        confidence: crop.score,
        reason: crop.reason,
        description: crop.description,
        growth_duration: crop.growth_duration,
      }));

    return new Response(
      JSON.stringify({
        recommendations: topRecommendations,
        input_summary: {
          conditions: `pH: ${inputData.soil_ph}, Temp: ${inputData.temperature}°C, Humidity: ${inputData.humidity}%, Rainfall: ${inputData.rainfall}mm`,
          air_quality_status: inputData.air_quality <= 100 ? "Good" : inputData.air_quality <= 200 ? "Moderate" : "Poor"
        }
      }),
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
      JSON.stringify({ error: error.message || "An error occurred during crop recommendation" }),
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