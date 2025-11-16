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

interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

// Input validation rules
const VALIDATION_RULES = {
  soil_ph: { min: 0.0, max: 14.0, required: true },
  temperature: { min: -10, max: 50, required: true },
  humidity: { min: 0, max: 100, required: true },
  rainfall: { min: 0, max: 5000, required: true },
  air_quality: { min: 0, max: 500, required: true }
};

const VALID_SOIL_TYPES = [
  "Clay", "Sandy", "Loamy", "Black", "Alluvial", "Sandy Loam", "Red",
  "Laterite", "Coastal", "Forest", "Volcanic", "Saline", "Peaty", "Chalky"
];

const VALID_SEASONS = [
  "Kharif", "Rabi", "Year-round", "Summer", "Winter", "Monsoon"
];

// Enhanced input validation function
function validateInput(inputData: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Validate soil pH
  if (typeof inputData.soil_ph !== 'number' || isNaN(inputData.soil_ph)) {
    errors.push({ field: "soil_ph", message: "Soil pH must be a valid number", severity: "error" });
  } else if (inputData.soil_ph < VALIDATION_RULES.soil_ph.min || inputData.soil_ph > VALIDATION_RULES.soil_ph.max) {
    errors.push({ field: "soil_ph", message: `Soil pH must be between ${VALIDATION_RULES.soil_ph.min} and ${VALIDATION_RULES.soil_ph.max}`, severity: "error" });
  }

  // Validate soil type
  if (!inputData.soil_type || typeof inputData.soil_type !== 'string') {
    errors.push({ field: "soil_type", message: "Soil type is required", severity: "error" });
  } else if (!VALID_SOIL_TYPES.includes(inputData.soil_type)) {
    errors.push({
      field: "soil_type",
      message: `Soil type "${inputData.soil_type}" not recognized. Valid types: ${VALID_SOIL_TYPES.join(", ")}`,
      severity: "warning"
    });
  }

  // Validate temperature
  if (typeof inputData.temperature !== 'number' || isNaN(inputData.temperature)) {
    errors.push({ field: "temperature", message: "Temperature must be a valid number", severity: "error" });
  } else {
    if (inputData.temperature < VALIDATION_RULES.temperature.min || inputData.temperature > VALIDATION_RULES.temperature.max) {
      errors.push({
        field: "temperature",
        message: `Temperature ${inputData.temperature}°C is outside typical agricultural range (${VALIDATION_RULES.temperature.min}°C to ${VALIDATION_RULES.temperature.max}°C)`,
        severity: "warning"
      });
    }
  }

  // Validate humidity
  if (typeof inputData.humidity !== 'number' || isNaN(inputData.humidity)) {
    errors.push({ field: "humidity", message: "Humidity must be a valid number", severity: "error" });
  } else if (inputData.humidity < VALIDATION_RULES.humidity.min || inputData.humidity > VALIDATION_RULES.humidity.max) {
    errors.push({ field: "humidity", message: `Humidity must be between ${VALIDATION_RULES.humidity.min}% and ${VALIDATION_RULES.humidity.max}%`, severity: "error" });
  }

  // Validate rainfall
  if (typeof inputData.rainfall !== 'number' || isNaN(inputData.rainfall)) {
    errors.push({ field: "rainfall", message: "Rainfall must be a valid number", severity: "error" });
  } else if (inputData.rainfall < VALIDATION_RULES.rainfall.min || inputData.rainfall > VALIDATION_RULES.rainfall.max) {
    errors.push({ field: "rainfall", message: `Rainfall must be between ${VALIDATION_RULES.rainfall.min}mm and ${VALIDATION_RULES.rainfall.max}mm annually`, severity: "error" });
  }

  // Validate air quality
  if (typeof inputData.air_quality !== 'number' || isNaN(inputData.air_quality)) {
    errors.push({ field: "air_quality", message: "Air quality index must be a valid number", severity: "error" });
  } else if (inputData.air_quality < VALIDATION_RULES.air_quality.min || inputData.air_quality > VALIDATION_RULES.air_quality.max) {
    errors.push({ field: "air_quality", message: `Air quality index must be between ${VALIDATION_RULES.air_quality.min} and ${VALIDATION_RULES.air_quality.max}`, severity: "error" });
  }

  // Validate season
  if (!inputData.season || typeof inputData.season !== 'string') {
    errors.push({ field: "season", message: "Season is required", severity: "error" });
  } else if (!VALID_SEASONS.includes(inputData.season)) {
    errors.push({
      field: "season",
      message: `Season "${inputData.season}" not recognized. Valid seasons: ${VALID_SEASONS.join(", ")}`,
      severity: "warning"
    });
  }

  const hasErrors = errors.some(e => e.severity === "error");
  return { isValid: !hasErrors, errors };
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
  // Enhanced soil compatibility matrix for South Indian soils
  const soilCompatibility: Record<string, string[]> = {
    "Clay": ["Black", "Alluvial", "Black Cotton"],
    "Sandy": ["Sandy Loam", "Coastal", "Saline"],
    "Loamy": ["Sandy Loam", "Alluvial", "Red", "Laterite"],
    "Black": ["Clay", "Alluvial", "Black Cotton", "Peaty"],
    "Alluvial": ["Loamy", "Black", "Clay", "Sandy Loam"],
    "Sandy Loam": ["Loamy", "Sandy", "Alluvial", "Red"],
    "Red": ["Laterite", "Loamy", "Sandy Loam", "Volcanic"],
    "Laterite": ["Red", "Loamy", "Volcanic", "Clay"],
    "Coastal": ["Sandy", "Saline", "Alluvial"],
    "Forest": ["Loamy", "Volcanic", "Peaty"],
    "Volcanic": ["Forest", "Laterite", "Loamy", "Red"],
    "Black Cotton": ["Black", "Clay", "Alluvial"],
    "Saline": ["Coastal", "Sandy"],
    "Peaty": ["Forest", "Black"],
    "Chalky": ["Loamy", "Sandy Loam"]
  };

  // Check for exact match first
  if (suitableSoils.includes(inputSoil)) {
    return 1.0;
  }

  // Check for soil compatibility
  let maxScore = 0;
  for (const suitable of suitableSoils) {
    const compatible = soilCompatibility[suitable] || [];
    if (compatible.includes(inputSoil)) {
      maxScore = Math.max(maxScore, 0.8);
    }

    // Check if compatible soils include each other (bidirectional)
    const inputCompatible = soilCompatibility[inputSoil] || [];
    if (inputCompatible.includes(suitable)) {
      maxScore = Math.max(maxScore, 0.7);
    }
  }

  // Enhanced soil classification scoring
  const soilClassification: Record<string, string> = {
    "Clay": "heavy",
    "Sandy": "light",
    "Loamy": "medium",
    "Black": "heavy",
    "Alluvial": "medium",
    "Sandy Loam": "medium-light",
    "Red": "medium",
    "Laterite": "medium",
    "Coastal": "light",
    "Forest": "medium",
    "Volcanic": "medium-heavy",
    "Black Cotton": "heavy",
    "Saline": "light",
    "Peaty": "heavy",
    "Chalky": "medium"
  };

  // Fallback to soil texture similarity
  if (maxScore === 0) {
    const inputClass = soilClassification[inputSoil] || "unknown";
    let matchingClasses = 0;

    for (const suitable of suitableSoils) {
      const suitableClass = soilClassification[suitable] || "unknown";
      if (inputClass === suitableClass) {
        matchingClasses++;
      }
    }

    if (matchingClasses > 0) {
      maxScore = 0.4 + (matchingClasses / suitableSoils.length) * 0.3;
    } else {
      maxScore = 0.2; // Minimal score for completely incompatible soils
    }
  }

  return Math.min(1.0, maxScore);
}

function calculateSynergy(...scores: number[]): number {
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  const consistency = 1 - Math.min(stdDev, 0.5);

  return consistency;
}

// Logging function for system monitoring
async function logSystemEvent(functionName: string, level: "INFO" | "WARN" | "ERROR", message: string, metadata?: any) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("system_logs").insert({
      function_name: functionName,
      log_level: level,
      message: message,
      metadata: metadata || {}
    });
  } catch (error) {
    console.error("Failed to log system event:", error);
  }
}

Deno.serve(async (req: Request) => {
  const functionName = "crop-recommendation";

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

    // Enhanced input validation
    const validation = validateInput(inputData);
    if (!validation.isValid) {
      const errorMessages = validation.errors
        .filter(e => e.severity === "error")
        .map(e => e.message);

      await logSystemEvent(functionName, "ERROR", "Invalid input parameters", {
        errors: validation.errors,
        input_data: inputData
      });

      return new Response(
        JSON.stringify({
          error: "Invalid input parameters",
          details: errorMessages,
          all_errors: validation.errors
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Log warnings if any
    const warnings = validation.errors.filter(e => e.severity === "warning");
    if (warnings.length > 0) {
      await logSystemEvent(functionName, "WARN", "Input validation warnings", {
        warnings: warnings,
        input_data: inputData
      });
    }

    // Fetch crops data with retry mechanism
    let crops = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries && !crops) {
      try {
        const { data, error } = await supabase
          .from("crops")
          .select("*");

        if (error) throw error;
        crops = data;

        if (!crops || crops.length === 0) {
          throw new Error("No crops found in database");
        }
      } catch (dbError) {
        retryCount++;
        console.warn(`Database query failed (attempt ${retryCount}/${maxRetries}):`, dbError);

        if (retryCount >= maxRetries) {
          await logSystemEvent(functionName, "ERROR", "Database connection failed", {
            error: dbError.message,
            retry_attempts: maxRetries
          });

          // Fallback to hardcoded crop data for critical functionality
          crops = getFallbackCropData();
          await logSystemEvent(functionName, "WARN", "Using fallback crop data", {
            crop_count: crops.length
          });
        } else {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    }

    // Process recommendations
    const scoredCrops: CropScore[] = crops.map((crop: any) => {
      try {
        const { score, reasons } = calculateNeuralNetworkScore(inputData, crop);

        return {
          name: crop.name,
          score: Math.round(score * 100) / 100,
          reason: reasons.join(", "),
          description: crop.description || "Agricultural crop",
          growth_duration: crop.growth_duration_days || 90,
        };
      } catch (cropError) {
        console.warn(`Error calculating score for crop ${crop.name}:`, cropError);
        return {
          name: crop.name,
          score: 0,
          reason: "Error calculating crop compatibility",
          description: crop.description || "Agricultural crop",
          growth_duration: crop.growth_duration_days || 90,
        };
      }
    });

    // Sort and get top recommendations
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

    // Calculate input summary
    const airQualityStatus = inputData.air_quality <= 100 ? "Good" :
                            inputData.air_quality <= 200 ? "Moderate" : "Poor";

    const inputSummary = {
      conditions: `pH: ${inputData.soil_ph}, Temp: ${inputData.temperature}°C, Humidity: ${inputData.humidity}%, Rainfall: ${inputData.rainfall}mm`,
      air_quality_status: airQualityStatus,
      soil_type: inputData.soil_type,
      season: inputData.season,
      validation_warnings: warnings.map(w => w.message)
    };

    // Log successful recommendation
    await logSystemEvent(functionName, "INFO", "Crop recommendation completed", {
      input_conditions: inputSummary.conditions,
      top_recommendations: topRecommendations.map(r => r.name),
      confidence_scores: topRecommendations.map(r => r.confidence)
    });

    return new Response(
      JSON.stringify({
        recommendations: topRecommendations,
        input_summary: inputSummary,
        total_crops_analyzed: crops.length,
        validation_warnings: warnings
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Critical error in crop recommendation:", error);

    await logSystemEvent(functionName, "ERROR", "Critical error in crop recommendation", {
      error: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during crop recommendation",
        request_id: crypto.randomUUID()
      }),
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

// Fallback crop data for emergency situations
function getFallbackCropData(): any[] {
  return [
    {
      name: "Rice",
      scientific_name: "Oryza sativa",
      description: "Staple cereal crop grown in flooded fields",
      season: "Kharif",
      optimal_ph_min: 5.5,
      optimal_ph_max: 7.0,
      optimal_temp_min: 20,
      optimal_temp_max: 35,
      optimal_humidity_min: 70,
      optimal_humidity_max: 90,
      optimal_rainfall_min: 1000,
      optimal_rainfall_max: 2500,
      suitable_soil_types: ["Clay", "Loamy"],
      growth_duration_days: 120
    },
    {
      name: "Wheat",
      scientific_name: "Triticum aestivum",
      description: "Major cereal crop for bread making",
      season: "Rabi",
      optimal_ph_min: 6.0,
      optimal_ph_max: 7.5,
      optimal_temp_min: 12,
      optimal_temp_max: 25,
      optimal_humidity_min: 50,
      optimal_humidity_max: 70,
      optimal_rainfall_min: 400,
      optimal_rainfall_max: 800,
      suitable_soil_types: ["Loamy", "Sandy Loam"],
      growth_duration_days: 110
    }
  ];
}