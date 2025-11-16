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

// Advanced Crop Recommendation Algorithm Components

interface EnvironmentalFactors {
  soil_ph: number;
  soil_type: string;
  temperature: number;
  humidity: number;
  air_quality: number;
  rainfall: number;
  season: string;
}

interface CropFeatures {
  environmental_score: number;
  economic_score: number;
  risk_score: number;
  sustainability_score: number;
  rotation_compatibility: number;
  climate_adaptation: number;
  market_demand: number;
}

interface AdvancedRecommendationResult {
  score: number;
  confidence: number;
  reasons: string[];
  risk_factors: string[];
  sustainability_score: number;
  economic_potential: number;
  rotation_suggestions: string[];
  irrigation_needs: string;
  fertilizer_needs: string;
  pest_risk: string;
  market_outlook: string;
}

// Enhanced input validation with agricultural constraints
function validateAdvancedInput(input: EnvironmentalFactors): { isValid: boolean; warnings: string[]; constraints: any } {
  const warnings: string[] = [];
  const constraints = {};

  // Check for extreme weather conditions
  if (input.temperature > 45) {
    warnings.push("Extreme temperature detected - heat stress likely");
    constraints["heat_stress"] = true;
  }
  if (input.temperature < 5) {
    warnings.push("Very low temperature - frost damage possible");
    constraints["frost_risk"] = true;
  }

  // Check water stress conditions
  if (input.rainfall < 300) {
    warnings.push("Low rainfall - drought-resistant crops recommended");
    constraints["irrigation_required"] = true;
  }
  if (input.rainfall > 3000) {
    warnings.push("High rainfall - waterlogging risk for some crops");
    constraints["drainage_needed"] = true;
  }

  // Check air quality for sensitive crops
  if (input.air_quality > 200) {
    warnings.push("Poor air quality - avoid sensitive crops");
    constraints["air_pollution_stress"] = true;
  }

  // Check soil pH for nutrient availability
  if (input.soil_ph < 4.5) {
    warnings.push("Very acidic soil - nutrient deficiencies likely");
    constraints["soil_amendment_required"] = "lime";
  }
  if (input.soil_ph > 8.5) {
    warnings.push("Very alkaline soil - micronutrient deficiencies likely");
    constraints["soil_amendment_required"] = "organic_matter";
  }

  return { isValid: true, warnings, constraints };
}

// Machine Learning-Inspired Feature Extraction
function extractCropFeatures(input: EnvironmentalFactors, crop: any): CropFeatures {
  // Environmental suitability with advanced scoring
  const envFactors = calculateEnvironmentalFactors(input, crop);

  // Economic viability scoring
  const econScore = calculateEconomicViability(crop, input);

  // Risk assessment
  const riskScore = assessCultivationRisk(input, crop);

  // Sustainability scoring
  const sustainabilityScore = calculateSustainabilityScore(crop, input);

  // Crop rotation compatibility
  const rotationScore = calculateRotationCompatibility(crop, input);

  // Climate adaptation scoring
  const climateScore = calculateClimateAdaptationScore(crop, input);

  // Market demand scoring
  const marketScore = calculateMarketDemandScore(crop);

  return {
    environmental_score: envFactors.score,
    economic_score: econScore,
    risk_score: riskScore,
    sustainability_score: sustainabilityScore,
    rotation_compatibility: rotationScore,
    climate_adaptation: climateScore,
    market_demand: marketScore
  };
}

// Advanced Environmental Factor Calculation
function calculateEnvironmentalFactors(input: EnvironmentalFactors, crop: any): { score: number; details: any } {
  // Dynamic weight adjustment based on crop type and region
  const baseWeights = {
    ph: 0.18,
    soil_type: 0.20,
    temperature: 0.24,
    humidity: 0.16,
    rainfall: 0.22
  };

  // Adjust weights based on crop category
  let adjustedWeights = { ...baseWeights };

  if (isRiceCrop(crop.name)) {
    adjustedWeights.rainfall = 0.28;
    adjustedWeights.humidity = 0.20;
    adjustedWeights.temperature = 0.16;
  } else if (isSpiceCrop(crop.name)) {
    adjustedWeights.humidity = 0.22;
    adjustedWeights.temperature = 0.20;
    adjustedWeights.soil_type = 0.24;
  } else if (isMilletCrop(crop.name)) {
    adjustedWeights.temperature = 0.28;
    adjustedWeights.rainfall = 0.16;
    adjustedWeights.soil_type = 0.20;
  }

  // Enhanced pH scoring with nutrient availability consideration
  const phScore = calculateAdvancedPHScore(input.soil_ph, crop);

  // Enhanced soil type scoring with water retention and drainage
  const soilScore = calculateAdvancedSoilScore(input.soil_type, crop, input.rainfall);

  // Temperature scoring with growing degree days consideration
  const tempScore = calculateAdvancedTemperatureScore(input.temperature, crop);

  // Humidity scoring with disease pressure consideration
  const humidityScore = calculateAdvancedHumidityScore(input.humidity, crop);

  // Rainfall scoring with water requirement and flood risk
  const rainfallScore = calculateAdvancedRainfallScore(input.rainfall, crop);

  const rawScore =
    adjustedWeights.ph * phScore +
    adjustedWeights.soil_type * soilScore +
    adjustedWeights.temperature * tempScore +
    adjustedWeights.humidity * humidityScore +
    adjustedWeights.rainfall * rainfallScore;

  // Air quality penalty for sensitive crops
  const airQualityPenalty = calculateAirQualityPenalty(input.air_quality, crop);
  const finalScore = rawScore * (1 - airQualityPenalty);

  return {
    score: Math.min(1.0, finalScore),
    details: {
      ph_score: phScore,
      soil_score: soilScore,
      temp_score: tempScore,
      humidity_score: humidityScore,
      rainfall_score: rainfallScore,
      air_quality_penalty: airQualityPenalty,
      weights: adjustedWeights
    }
  };
}

// Advanced pH scoring with nutrient availability matrix
function calculateAdvancedPHScore(ph: number, crop: any): number {
  // Nutrient availability curves for different pH ranges
  const nutrientAvailability = {
    nitrogen: ph >= 6.0 && ph <= 8.0 ? 1.0 : (ph < 6.0 ? 0.3 + (ph / 6.0) * 0.7 : 0.9 - (ph - 8.0) * 0.1),
    phosphorus: ph >= 6.5 && ph <= 7.5 ? 1.0 : (ph < 6.5 ? 0.2 + (ph / 6.5) * 0.8 : 0.8 - (ph - 7.5) * 0.16),
    potassium: ph >= 5.5 && ph <= 8.5 ? 1.0 : (ph < 5.5 ? 0.1 + (ph / 5.5) * 0.9 : 0.9 - (ph - 8.5) * 0.06),
    micronutrients: ph >= 5.5 && ph <= 6.5 ? 1.0 : (ph < 5.5 ? 0.6 : ph > 6.5 ? 0.7 - (ph - 6.5) * 0.1 : 1.0)
  };

  // Calculate overall nutrient availability
  const overallAvailability = (
    nutrientAvailability.nitrogen * 0.3 +
    nutrientAvailability.phosphorus * 0.3 +
    nutrientAvailability.potassium * 0.2 +
    nutrientAvailability.micronutrients * 0.2
  );

  // Basic Gaussian score for optimal range
  const basicScore = calculateGaussianScore(ph, crop.optimal_ph_min, crop.optimal_ph_max, 1.2);

  // Combine basic score with nutrient availability
  return Math.min(1.0, basicScore * 0.6 + overallAvailability * 0.4);
}

// Advanced soil scoring with water dynamics
function calculateAdvancedSoilScore(soilType: string, crop: any, rainfall: number): number {
  const exactMatch = crop.suitable_soil_types?.includes(soilType);
  if (exactMatch) return 1.0;

  const soilSimilarity = calculateSoilSimilarity(soilType, crop.suitable_soil_types || []);

  // Water retention and drainage characteristics
  const soilCharacteristics = getSoilWaterCharacteristics(soilType);
  const cropWaterNeeds = getCropWaterRequirements(crop.name);

  // Calculate water compatibility
  let waterCompatibility = 1.0;
  if (rainfall < 800) { // Low rainfall area
    waterCompatibility = soilCharacteristics.water_retention > 0.6 ? 1.0 : 0.7;
  } else if (rainfall > 2000) { // High rainfall area
    waterCompatibility = soilCharacteristics.drainage > 0.6 ? 1.0 : 0.6;
  }

  return Math.min(1.0, soilSimilarity * 0.7 + waterCompatibility * 0.3);
}

// Advanced temperature scoring with growing degree days
function calculateAdvancedTemperatureScore(temp: number, crop: any): number {
  const basicScore = calculateGaussianScore(temp, crop.optimal_temp_min, crop.optimal_temp_max, 1.8);

  // Growing degree days calculation
  const gddRequirement = getCropGDDRequirement(crop.name);
  const seasonalGDD = calculateSeasonalGDD(temp, crop.season);

  let gddScore = 1.0;
  if (gddRequirement && seasonalGDD) {
    const gddRatio = seasonalGDD / gddRequirement;
    gddScore = gddRatio >= 1.0 ? 1.0 : Math.max(0.3, gddRatio);
  }

  // Heat stress consideration
  const heatStressFactor = temp > 35 ? Math.max(0.5, 1.0 - (temp - 35) * 0.05) : 1.0;

  return Math.min(1.0, basicScore * 0.6 + gddScore * 0.3 + heatStressFactor * 0.1);
}

// Advanced humidity scoring with disease pressure
function calculateAdvancedHumidityScore(humidity: number, crop: any): number {
  const basicScore = calculateGaussianScore(humidity, crop.optimal_humidity_min, crop.optimal_humidity_max, 2.0);

  // Disease pressure calculation
  const diseaseRisk = calculateDiseaseRisk(humidity, crop.name);
  const diseaseFactor = Math.max(0.3, 1.0 - diseaseRisk * 0.3);

  return Math.min(1.0, basicScore * 0.7 + diseaseFactor * 0.3);
}

// Advanced rainfall scoring with flood and drought consideration
function calculateAdvancedRainfallScore(rainfall: number, crop: any): number {
  const basicScore = calculateGaussianScore(rainfall, crop.optimal_rainfall_min, crop.optimal_rainfall_max, 2.5);

  // Flood risk assessment
  const floodRisk = rainfall > 2500 ? Math.min(0.8, (rainfall - 2500) / 2000) : 0;

  // Drought risk assessment
  const droughtRisk = rainfall < 500 ? Math.min(0.8, (500 - rainfall) / 500) : 0;

  const riskFactor = 1.0 - (floodRisk + droughtRisk) * 0.5;

  return Math.min(1.0, basicScore * 0.8 + riskFactor * 0.2);
}

// Multi-Criteria Decision Making (MCDM) using TOPSIS method
function calculateMCDMScore(features: CropFeatures): { score: number; ranking: string[] } {
  // Criteria weights for TOPSIS
  const criteriaWeights = {
    environmental_score: 0.30,
    economic_score: 0.25,
    sustainability_score: 0.20,
    risk_score: 0.15,
    climate_adaptation: 0.10
  };

  // Normalize features
  const maxValues = {
    environmental_score: 1.0,
    economic_score: 1.0,
    sustainability_score: 1.0,
    risk_score: 1.0,
    climate_adaptation: 1.0
  };

  // Calculate weighted normalized decision matrix
  const weightedScores = {
    environmental: features.environmental_score * criteriaWeights.environmental_score,
    economic: features.economic_score * criteriaWeights.economic_score,
    sustainability: features.sustainability_score * criteriaWeights.sustainability_score,
    risk: features.risk_score * criteriaWeights.risk_score,
    climate: features.climate_adaptation * criteriaWeights.climate_adaptation
  };

  // Calculate Euclidean distance from ideal and negative ideal solutions
  const idealDistance = Math.sqrt(
    Math.pow(1 - weightedScores.environmental, 2) +
    Math.pow(1 - weightedScores.economic, 2) +
    Math.pow(1 - weightedScores.sustainability, 2) +
    Math.pow(1 - weightedScores.risk, 2) +
    Math.pow(1 - weightedScores.climate, 2)
  );

  const negativeIdealDistance = Math.sqrt(
    Math.pow(0 - weightedScores.environmental, 2) +
    Math.pow(0 - weightedScores.economic, 2) +
    Math.pow(0 - weightedScores.sustainability, 2) +
    Math.pow(0 - weightedScores.risk, 2) +
    Math.pow(0 - weightedScores.climate, 2)
  );

  // TOPSIS score
  const topsisScore = negativeIdealDistance / (idealDistance + negativeIdealDistance);

  // Performance ranking
  const rankings = Object.entries(weightedScores)
    .sort(([,a], [,b]) => b - a)
    .map(([criterion, score]) => `${criterion}: ${(score * 100).toFixed(1)}%`);

  return { score: topsisScore, ranking: rankings };
}

// Economic viability calculation
function calculateEconomicViability(crop: any, input: EnvironmentalFactors): number {
  // Base economic score (would integrate with real market data)
  const cropValue = getCropMarketValue(crop.name);
  const yieldPotential = calculateYieldPotential(crop, input);
  const inputCosts = calculateInputCosts(crop, input);
  const marketDemand = features?.market_demand || 0.7;

  // Simple ROI calculation
  const revenue = cropValue * yieldPotential;
  const profit = revenue - inputCosts;
  const roi = inputCosts > 0 ? profit / inputCosts : 0;

  // Normalize to 0-1 scale
  const normalizedROI = Math.max(0, Math.min(1, roi / 2)); // Assume 200% ROI as max

  return normalizedROI * 0.6 + marketDemand * 0.4;
}

// Risk assessment calculation
function assessCultivationRisk(input: EnvironmentalFactors, crop: any): number {
  let totalRisk = 0;

  // Climate risk
  const climateRisk = assessClimateRisk(input, crop);
  totalRisk += climateRisk * 0.3;

  // Pest and disease risk
  const pestRisk = assessPestRisk(input, crop);
  totalRisk += pestRisk * 0.25;

  // Market risk
  const marketRisk = assessMarketRisk(crop.name);
  totalRisk += marketRisk * 0.2;

  // Environmental risk
  const envRisk = assessEnvironmentalRisk(input, crop);
  totalRisk += envRisk * 0.15;

  // Operational risk
  const operationalRisk = assessOperationalRisk(crop, input);
  totalRisk += operationalRisk * 0.1;

  // Convert to 0-1 scale (higher = lower risk)
  return Math.max(0, Math.min(1, 1 - totalRisk));
}

// Sustainability scoring
function calculateSustainabilityScore(crop: any, input: EnvironmentalFactors): number {
  // Water usage efficiency
  const waterEfficiency = calculateWaterEfficiency(crop, input.rainfall);

  // Soil health impact
  const soilHealthImpact = calculateSoilHealthImpact(crop, input.soil_type);

  // Biodiversity impact
  const biodiversityImpact = calculateBiodiversityImpact(crop);

  // Carbon footprint
  const carbonFootprint = calculateCarbonFootprint(crop);

  // Input dependency
  const inputDependency = calculateInputDependency(crop);

  return (
    waterEfficiency * 0.25 +
    soilHealthImpact * 0.25 +
    biodiversityImpact * 0.2 +
    (1 - carbonFootprint) * 0.15 +
    (1 - inputDependency) * 0.15
  );
}

// Main advanced crop recommendation function
function calculateAdvancedCropRecommendation(
  input: EnvironmentalFactors,
  crop: any
): AdvancedRecommendationResult {
  // Validate and extract constraints
  const validation = validateAdvancedInput(input);
  const features = extractCropFeatures(input, crop);
  const mcdmResult = calculateMCDMScore(features);

  // Generate comprehensive reasons
  const reasons = generateRecommendationReasons(features, validation, crop);

  // Generate risk factors
  const riskFactors = generateRiskFactors(features, input, crop);

  // Generate additional recommendations
  const rotationSuggestions = generateRotationSuggestions(crop);
  const irrigationNeeds = generateIrrigationRecommendation(crop, input.rainfall);
  const fertilizerNeeds = generateFertilizerRecommendation(crop, input.soil_ph);
  const pestRisk = assessPestRiskLevel(features.risk_score, input.humidity);
  const marketOutlook = generateMarketOutlook(crop.name, features.market_demand);

  // Calculate final confidence
  const confidence = calculateRecommendationConfidence(features, validation);

  return {
    score: Math.round(mcdmResult.score * 100),
    confidence: Math.round(confidence * 100),
    reasons,
    risk_factors: riskFactors,
    sustainability_score: Math.round(features.sustainability_score * 100),
    economic_potential: Math.round(features.economic_score * 100),
    rotation_suggestions: rotationSuggestions,
    irrigation_needs: irrigationNeeds,
    fertilizer_needs: fertilizerNeeds,
    pest_risk: pestRisk,
    market_outlook: marketOutlook
  };
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

// === ADVANCED ALGORITHM HELPER FUNCTIONS ===

// Crop type identification functions
function isRiceCrop(cropName: string): boolean {
  const riceCrops = ["Rice", "Basmati Rice", "Jasmine Rice"];
  return riceCrops.some(rice => cropName.toLowerCase().includes(rice.toLowerCase()));
}

function isSpiceCrop(cropName: string): boolean {
  const spiceCrops = ["Black Pepper", "Cardamom", "Turmeric", "Ginger", "Clove", "Cinnamon"];
  return spiceCrops.some(spice => cropName.toLowerCase().includes(spice.toLowerCase()));
}

function isMilletCrop(cropName: string): boolean {
  const milletCrops = ["Finger Millet", "Pearl Millet", "Foxtail Millet", "Little Millet"];
  return milletCrops.some(millet => cropName.toLowerCase().includes(millet.toLowerCase()));
}

// Agricultural data functions
function getSoilWaterCharacteristics(soilType: string): { water_retention: number; drainage: number } {
  const characteristics: Record<string, { water_retention: number; drainage: number }> = {
    "Clay": { water_retention: 0.9, drainage: 0.2 },
    "Sandy": { water_retention: 0.3, drainage: 0.9 },
    "Loamy": { water_retention: 0.6, drainage: 0.7 },
    "Black": { water_retention: 0.8, drainage: 0.3 },
    "Alluvial": { water_retention: 0.7, drainage: 0.6 },
    "Sandy Loam": { water_retention: 0.5, drainage: 0.8 },
    "Red": { water_retention: 0.6, drainage: 0.7 },
    "Laterite": { water_retention: 0.4, drainage: 0.8 },
    "Coastal": { water_retention: 0.4, drainage: 0.9 },
    "Forest": { water_retention: 0.7, drainage: 0.7 },
    "Volcanic": { water_retention: 0.6, drainage: 0.8 }
  };
  return characteristics[soilType] || { water_retention: 0.5, drainage: 0.5 };
}

function getCropWaterRequirements(cropName: string): { requirement: string; efficiency: number } {
  const waterRequirements: Record<string, { requirement: string; efficiency: number }> = {
    "Rice": { requirement: "high", efficiency: 0.6 },
    "Wheat": { requirement: "medium", efficiency: 0.8 },
    "Cotton": { requirement: "medium", efficiency: 0.7 },
    "Sugarcane": { requirement: "high", efficiency: 0.7 },
    "Maize": { requirement: "medium", efficiency: 0.8 },
    "Soybean": { requirement: "medium", efficiency: 0.8 },
    "Black Pepper": { requirement: "high", efficiency: 0.7 },
    "Cardamom": { requirement: "high", efficiency: 0.6 },
    "Coconut": { requirement: "high", efficiency: 0.7 },
    "Finger Millet": { requirement: "low", efficiency: 0.9 },
    "Pearl Millet": { requirement: "low", efficiency: 0.95 }
  };
  return waterRequirements[cropName] || { requirement: "medium", efficiency: 0.8 };
}

function getCropGDDRequirement(cropName: string): number {
  const gddRequirements: Record<string, number> = {
    "Rice": 2500,
    "Wheat": 1800,
    "Cotton": 2200,
    "Maize": 2700,
    "Soybean": 2000,
    "Tomato": 2200,
    "Potato": 1600,
    "Black Pepper": 2800,
    "Cardamom": 2600,
    "Coffee": 3000,
    "Finger Millet": 1400,
    "Pearl Millet": 1200
  };
  return gddRequirements[cropName] || 2000;
}

function calculateSeasonalGDD(temperature: number, season: string): number {
  const seasonLengths: Record<string, number> = {
    "Kharif": 120,
    "Rabi": 90,
    "Summer": 75,
    "Winter": 60,
    "Monsoon": 105,
    "Year-round": 180
  };

  const baseTemp = 10; // Base temperature for GDD calculation
  const dailyGDD = Math.max(0, temperature - baseTemp);
  return dailyGDD * (seasonLengths[season] || 90);
}

function calculateDiseaseRisk(humidity: number, cropName: string): number {
  let baseRisk = 0;

  // Crops susceptible to fungal diseases in high humidity
  const susceptibleCrops = ["Tomato", "Potato", "Grapes", "Rice", "Wheat"];
  if (susceptibleCrops.includes(cropName)) {
    baseRisk = 0.3;
  }

  // Humidity-based risk calculation
  if (humidity > 85) return Math.min(0.9, baseRisk + 0.6);
  if (humidity > 75) return Math.min(0.7, baseRisk + 0.4);
  if (humidity > 65) return Math.min(0.5, baseRisk + 0.2);
  return baseRisk;
}

function calculateAirQualityPenalty(aqi: number, crop: any): number {
  // Sensitive crops list
  const sensitiveCrops = ["Coffee", "Tea", "Spices", "Medicinal Herbs"];
  const isSensitive = sensitiveCrops.some(sensitive =>
    crop.name.toLowerCase().includes(sensitive.toLowerCase())
  );

  let penalty = 0;
  if (aqi > 300) penalty = 0.4;  // Hazardous
  else if (aqi > 200) penalty = 0.25;  // Very Unhealthy
  else if (aqi > 150) penalty = 0.15;  // Unhealthy for Sensitive Groups
  else if (aqi > 100) penalty = 0.08;  // Moderate

  return isSensitive ? penalty * 1.5 : penalty;
}

// Economic calculation functions
function getCropMarketValue(cropName: string): number {
  const marketValues: Record<string, number> = {
    "Rice": 25000,
    "Wheat": 22000,
    "Cotton": 60000,
    "Sugarcane": 3000,
    "Maize": 18000,
    "Soybean": 45000,
    "Potato": 15000,
    "Tomato": 20000,
    "Black Pepper": 300000,
    "Cardamom": 1200000,
    "Coffee": 250000,
    "Tea": 150000,
    "Turmeric": 80000,
    "Ginger": 60000,
    "Coconut": 40000
  };
  return marketValues[cropName] || 20000; // Default value in INR per ton
}

function calculateYieldPotential(crop: any, input: EnvironmentalFactors): number {
  // Base yield by crop category
  const baseYields: Record<string, number> = {
    "Rice": 3.5,  // tons per hectare
    "Wheat": 3.0,
    "Cotton": 1.5,
    "Maize": 4.0,
    "Soybean": 1.8,
    "Spices": 0.8,
    "Vegetables": 15.0,
    "Fruits": 8.0
  };

  // Determine crop category
  let category = "Others";
  if (isRiceCrop(crop.name)) category = "Rice";
  else if (crop.name === "Wheat") category = "Wheat";
  else if (crop.name === "Cotton") category = "Cotton";
  else if (crop.name === "Maize") category = "Maize";
  else if (crop.name === "Soybean") category = "Soybean";
  else if (isSpiceCrop(crop.name)) category = "Spices";
  else if (["Tomato", "Potato"].includes(crop.name)) category = "Vegetables";
  else if (["Mango", "Banana", "Coconut"].includes(crop.name)) category = "Fruits";

  const baseYield = baseYields[category] || 2.0;

  // Environmental adjustment factors
  const tempFactor = input.temperature >= 20 && input.temperature <= 30 ? 1.0 : 0.8;
  const rainfallFactor = input.rainfall >= 1000 && input.rainfall <= 2000 ? 1.0 :
                         input.rainfall < 500 ? 0.6 : 0.8;
  const phFactor = input.soil_ph >= 6.0 && input.soil_ph <= 7.5 ? 1.0 : 0.85;

  return baseYield * tempFactor * rainfallFactor * phFactor;
}

function calculateInputCosts(crop: any, input: EnvironmentalFactors): number {
  const baseCosts: Record<string, number> = {
    "Rice": 35000,  // INR per hectare
    "Wheat": 25000,
    "Cotton": 45000,
    "Maize": 30000,
    "Soybean": 28000,
    "Spices": 60000,
    "Vegetables": 50000,
    "Fruits": 40000
  };

  // Determine category and get base cost
  let category = "Others";
  if (isRiceCrop(crop.name)) category = "Rice";
  else if (crop.name === "Wheat") category = "Wheat";
  else if (crop.name === "Cotton") category = "Cotton";
  // ... (similar to yield calculation)

  const baseCost = baseCosts[category] || 30000;

  // Irrigation cost adjustment
  const irrigationCost = input.rainfall < 800 ? 15000 : input.rainfall < 1200 ? 8000 : 0;

  // Soil amendment cost
  let amendmentCost = 0;
  if (input.soil_ph < 5.5) amendmentCost = 5000;  // Lime
  if (input.soil_ph > 8.0) amendmentCost = 3000;  // Organic matter

  return baseCost + irrigationCost + amendmentCost;
}

function calculateMarketDemandScore(crop: any): number {
  const demandScores: Record<string, number> = {
    "Rice": 0.9,
    "Wheat": 0.85,
    "Cotton": 0.75,
    "Maize": 0.8,
    "Soybean": 0.7,
    "Black Pepper": 0.85,
    "Cardamom": 0.8,
    "Coffee": 0.75,
    "Tea": 0.8,
    "Turmeric": 0.75,
    "Ginger": 0.7,
    "Finger Millet": 0.6,
    "Pearl Millet": 0.55
  };
  return demandScores[crop.name] || 0.65;
}

// Risk assessment functions
function assessClimateRisk(input: EnvironmentalFactors, crop: any): number {
  let risk = 0;

  // Temperature stress
  if (input.temperature < crop.optimal_temp_min - 5 || input.temperature > crop.optimal_temp_max + 5) {
    risk += 0.3;
  }

  // Rainfall variability
  const rainfallDeviation = Math.abs(input.rainfall -
    (crop.optimal_rainfall_min + crop.optimal_rainfall_max) / 2);
  if (rainfallDeviation > 1000) risk += 0.25;

  // Season mismatch
  if (crop.season !== "Year-round" && crop.season !== input.season) {
    risk += 0.2;
  }

  return Math.min(1.0, risk);
}

function assessPestRisk(input: EnvironmentalFactors, crop: any): number {
  let risk = 0;

  // High humidity increases pest risk
  if (input.humidity > 80) risk += 0.2;

  // Warm temperatures increase pest activity
  if (input.temperature > 25 && input.temperature < 35) risk += 0.15;

  // Crop-specific pest susceptibility
  const susceptibleCrops = ["Tomato", "Potato", "Cotton", "Chili", "Brinjal"];
  if (susceptibleCrops.includes(crop.name)) risk += 0.1;

  return Math.min(1.0, risk);
}

function assessMarketRisk(cropName: string): number {
  const priceVolatility: Record<string, number> = {
    "Cotton": 0.4,
    "Spices": 0.35,
    "Vegetables": 0.3,
    "Fruits": 0.25,
    "Grains": 0.15,
    "Pulses": 0.2
  };

  // Determine category
  if (cropName === "Cotton") return priceVolatility.Cotton;
  if (isSpiceCrop(cropName)) return priceVolatility.Spices;
  if (["Tomato", "Potato"].includes(cropName)) return priceVolatility.Vegetables;
  if (["Mango", "Banana", "Coconut"].includes(cropName)) return priceVolatility.Fruits;
  if (["Rice", "Wheat", "Maize"].includes(cropName)) return priceVolatility.Grains;
  if (["Red Gram", "Green Gram", "Black Gram"].includes(cropName)) return priceVolatility.Pulses;

  return 0.25; // Default moderate risk
}

function assessEnvironmentalRisk(input: EnvironmentalFactors, crop: any): number {
  let risk = 0;

  // Air quality risk
  if (input.air_quality > 200) risk += 0.15;

  // Soil degradation risk
  if (input.soil_ph < 4.5 || input.soil_ph > 9.0) risk += 0.2;

  // Water stress risk
  if (input.rainfall < 300 || input.rainfall > 3500) risk += 0.15;

  return Math.min(1.0, risk);
}

function assessOperationalRisk(crop: any, input: EnvironmentalFactors): number {
  let risk = 0;

  // Skill-intensive crops
  const skillIntensiveCrops = ["Coffee", "Cardamom", "Black Pepper", "Spices"];
  if (skillIntensiveCrops.includes(crop.name)) risk += 0.1;

  // Labor-intensive crops
  const laborIntensiveCrops = ["Cotton", "Sugarcane", "Vegetables"];
  if (laborIntensiveCrops.includes(crop.name)) risk += 0.08;

  return Math.min(1.0, risk);
}

// Sustainability functions
function calculateWaterEfficiency(crop: any, rainfall: number): number {
  const waterNeeds = getCropWaterRequirements(crop.name);

  if (waterNeeds.requirement === "low") return 0.9;
  if (waterNeeds.requirement === "medium") return 0.75;
  if (waterNeeds.requirement === "high") {
    return rainfall >= 1500 ? 0.7 : 0.5;
  }
  return 0.7;
}

function calculateSoilHealthImpact(crop: any, soilType: string): number {
  // Legumes improve soil health
  const legumes = ["Soybean", "Green Gram", "Black Gram", "Red Gram", "Peas"];
  if (legumes.includes(crop.name)) return 0.9;

  // Deep-rooted crops improve soil structure
  const deepRooted = ["Coconut", "Mango", "Sugarcane", "Cotton"];
  if (deepRooted.includes(crop.name)) return 0.8;

  // Cover crops
  const coverCrops = ["Finger Millet", "Pearl Millet"];
  if (coverCrops.includes(crop.name)) return 0.85;

  return 0.7; // Neutral impact
}

function calculateBiodiversityImpact(crop: any): number {
  // Perennial crops support biodiversity
  const perennials = ["Coconut", "Mango", "Banana", "Coffee", "Tea", "Rubber"];
  if (perennials.includes(crop.name)) return 0.85;

  // Diverse cropping systems
  const diverseCrops = ["Spices", "Herbs", "Vegetables"];
  if (diverseCrops.includes(crop.name)) return 0.8;

  // Monoculture-prone crops
  const monocultureCrops = ["Rice", "Wheat", "Maize", "Cotton"];
  if (monocultureCrops.includes(crop.name)) return 0.6;

  return 0.7;
}

function calculateCarbonFootprint(crop: any): number {
  // High input crops have higher carbon footprint
  const highInputCrops = ["Rice", "Cotton", "Sugarcane", "Vegetables"];
  if (highInputCrops.includes(crop.name)) return 0.7;

  // Low input crops
  const lowInputCrops = ["Millets", "Pulses", "Oilseeds"];
  if (lowInputCrops.includes(crop.name)) return 0.3;

  return 0.5; // Medium footprint
}

function calculateInputDependency(crop: any): number {
  // Calculate dependency on external inputs
  let dependency = 0.5; // Base dependency

  // Fertilizer dependency
  const fertilizerIntensive = ["Rice", "Wheat", "Maize", "Cotton"];
  if (fertilizerIntensive.includes(crop.name)) dependency += 0.2;

  // Pesticide dependency
  const pesticideIntensive = ["Cotton", "Vegetables", "Fruits"];
  if (pesticideIntensive.includes(crop.name)) dependency += 0.2;

  // Irrigation dependency
  const irrigationIntensive = ["Rice", "Sugarcane", "Banana"];
  if (irrigationIntensive.includes(crop.name)) dependency += 0.15;

  return Math.min(1.0, dependency);
}

// Additional helper functions (stubs for now - can be expanded)
function calculateRotationCompatibility(crop: any, input: EnvironmentalFactors): number {
  // Simplified rotation compatibility
  return 0.75; // Medium compatibility for most crops
}

function calculateClimateAdaptationScore(crop: any, input: EnvironmentalFactors): number {
  let score = 0.7; // Base adaptation score

  // Temperature tolerance
  if (crop.name === "Pearl Millet" || crop.name === "Finger Millet") {
    score += 0.2; // Heat tolerant
  }

  // Drought tolerance
  if (crop.name === "Pearl Millet" || crop.name === "Red Gram") {
    score += 0.15;
  }

  return Math.min(1.0, score);
}

// Recommendation generation functions
function generateRecommendationReasons(features: CropFeatures, validation: any, crop: any): string[] {
  const reasons: string[] = [];

  if (features.environmental_score > 0.8) {
    reasons.push("Excellent environmental match");
  } else if (features.environmental_score > 0.6) {
    reasons.push("Good environmental conditions");
  }

  if (features.economic_score > 0.7) {
    reasons.push("Strong economic potential");
  }

  if (features.sustainability_score > 0.7) {
    reasons.push("Sustainable farming choice");
  }

  if (features.risk_score > 0.8) {
    reasons.push("Low cultivation risk");
  }

  if (validation.warnings.length > 0) {
    reasons.push("Requires careful management");
  }

  return reasons.length > 0 ? reasons : ["Suitable for cultivation"];
}

function generateRiskFactors(features: CropFeatures, input: EnvironmentalFactors, crop: any): string[] {
  const risks: string[] = [];

  if (features.risk_score < 0.5) {
    risks.push("High cultivation risk");
  }

  if (input.temperature > 35) {
    risks.push("Heat stress conditions");
  }

  if (input.rainfall < 400) {
    risks.push("Water stress risk");
  }

  if (input.humidity > 85) {
    risks.push("Disease pressure high");
  }

  return risks;
}

function generateRotationSuggestions(crop: any): string[] {
  const rotations: Record<string, string[]> = {
    "Rice": ["Legumes", "Vegetables", "Green manure"],
    "Wheat": ["Legumes", "Mustard", "Vegetables"],
    "Cotton": ["Legumes", "Millets", "Vegetables"],
    "Maize": ["Legumes", "Vegetables", "Oilseeds"]
  };

  return rotations[crop.name] || ["Legumes", "Vegetables"];
}

function generateIrrigationRecommendation(crop: any, rainfall: number): string {
  const waterNeeds = getCropWaterRequirements(crop.name);

  if (waterNeeds.requirement === "low" && rainfall > 800) {
    return "No irrigation needed";
  } else if (waterNeeds.requirement === "medium" && rainfall < 600) {
    return "Supplemental irrigation required";
  } else if (waterNeeds.requirement === "high" && rainfall < 1200) {
    return "Regular irrigation essential";
  } else {
    return "Monitor soil moisture";
  }
}

function generateFertilizerRecommendation(crop: any, soilPH: number): string {
  if (soilPH < 5.5) {
    return "Apply lime along with balanced NPK";
  } else if (soilPH > 7.5) {
    return "Use organic matter and sulfur-based fertilizers";
  } else {
    return "Balanced NPK application recommended";
  }
}

function assessPestRiskLevel(riskScore: number, humidity: number): string {
  if (riskScore < 0.4 || humidity > 85) {
    return "High - implement integrated pest management";
  } else if (riskScore < 0.7) {
    return "Moderate - regular monitoring required";
  } else {
    return "Low - standard precautions sufficient";
  }
}

function generateMarketOutlook(cropName: string, marketDemand: number): string {
  if (marketDemand > 0.8) {
    return "Strong demand and good prices expected";
  } else if (marketDemand > 0.6) {
    return "Stable market with moderate returns";
  } else {
    return "Variable market, monitor price trends";
  }
}

function calculateRecommendationConfidence(features: CropFeatures, validation: any): number {
  let confidence = 0.7; // Base confidence

  // Environmental match increases confidence
  if (features.environmental_score > 0.8) confidence += 0.15;
  else if (features.environmental_score > 0.6) confidence += 0.1;

  // Low risk increases confidence
  if (features.risk_score > 0.8) confidence += 0.1;
  else if (features.risk_score < 0.5) confidence -= 0.15;

  // Warnings decrease confidence
  if (validation.warnings.length > 0) confidence -= 0.1 * validation.warnings.length;

  return Math.max(0.3, Math.min(0.95, confidence));
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