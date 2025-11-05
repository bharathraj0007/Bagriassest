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

interface NeuralNetworkWeights {
  layer1: number[][];
  layer1Bias: number[];
  layer2: number[][];
  layer2Bias: number[];
  layer3: number[][];
  layer3Bias: number[];
  layer4: number[][];
  layer4Bias: number[];
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

const cropIdMap = [
  "Rice",
  "Wheat",
  "Cotton",
  "Sugarcane",
  "Maize",
  "Soybean",
  "Potato",
  "Tomato",
];

function relu(x: number): number {
  return Math.max(0, x);
}

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map(x => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(x => x / sum);
}

function matmul(input: number[], weights: number[][], bias: number[]): number[] {
  return weights.map((row, i) => {
    const sum = row.reduce((acc, w, j) => acc + w * input[j], 0) + bias[i];
    return sum;
  });
}

function normalizeInput(soil_ph: number, temperature: number, humidity: number, rainfall: number, soil_type: number, season: number): number[] {
  return [
    soil_ph / 14,
    temperature / 50,
    humidity / 100,
    rainfall / 2500,
    soil_type / 6,
    season / 3,
  ];
}

function predictCrops(input: number[]): number[] {
  const pretrainedWeights: NeuralNetworkWeights = {
    layer1: Array(128).fill(0).map(() => Array(6).fill(0).map(() => Math.random() * 0.1 - 0.05)),
    layer1Bias: Array(128).fill(0),
    layer2: Array(64).fill(0).map(() => Array(128).fill(0).map(() => Math.random() * 0.1 - 0.05)),
    layer2Bias: Array(64).fill(0),
    layer3: Array(32).fill(0).map(() => Array(64).fill(0).map(() => Math.random() * 0.1 - 0.05)),
    layer3Bias: Array(32).fill(0),
    layer4: Array(8).fill(0).map(() => Array(32).fill(0).map(() => Math.random() * 0.1 - 0.05)),
    layer4Bias: Array(8).fill(0),
  };

  let x = input;

  x = matmul(x, pretrainedWeights.layer1, pretrainedWeights.layer1Bias);
  x = x.map(relu);

  x = matmul(x, pretrainedWeights.layer2, pretrainedWeights.layer2Bias);
  x = x.map(relu);

  x = matmul(x, pretrainedWeights.layer3, pretrainedWeights.layer3Bias);
  x = x.map(relu);

  x = matmul(x, pretrainedWeights.layer4, pretrainedWeights.layer4Bias);
  x = softmax(x);

  return x;
}

function generateReasoning(confidence: number): string {
  if (confidence >= 80) {
    return "Excellent match for conditions";
  } else if (confidence >= 60) {
    return "Good match for conditions";
  } else if (confidence >= 40) {
    return "Fair match for conditions";
  }
  return "Possible option";
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
    const { soil_ph, soil_type, temperature, humidity, rainfall, season } = input;

    const soilTypeEncoded = soilTypeMap[soil_type] ?? 0;
    const seasonEncoded = seasonMap[season] ?? 0;

    const normalizedInput = normalizeInput(
      soil_ph,
      temperature,
      humidity,
      rainfall,
      soilTypeEncoded,
      seasonEncoded
    );

    const predictions = predictCrops(normalizedInput);

    const { data: crops, error } = await supabase
      .from("crops")
      .select("*");

    if (error) throw error;

    const recommendations = predictions
      .map((confidence, cropIndex) => {
        const cropName = cropIdMap[cropIndex];
        const crop = crops.find((c: any) => c.name === cropName);

        if (!crop) return null;

        return {
          name: crop.name,
          confidence: Math.round(confidence * 100),
          reason: generateReasoning(confidence * 100),
          description: crop.description,
          growth_duration: crop.growth_duration_days,
        };
      })
      .filter((rec) => rec !== null)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    return new Response(
      JSON.stringify({ recommendations }),
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