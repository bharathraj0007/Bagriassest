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

    const { soil_ph, soil_type, temperature, humidity, air_quality, rainfall, season } = await req.json();

    const { data: crops, error } = await supabase
      .from("crops")
      .select("*");

    if (error) throw error;

    const scoredCrops: CropScore[] = crops.map((crop: any) => {
      let score = 0;
      let reasons: string[] = [];

      if (soil_ph >= crop.optimal_ph_min && soil_ph <= crop.optimal_ph_max) {
        score += 25;
        reasons.push("Optimal pH range");
      } else {
        const phDiff = Math.min(
          Math.abs(soil_ph - crop.optimal_ph_min),
          Math.abs(soil_ph - crop.optimal_ph_max)
        );
        score += Math.max(0, 25 - phDiff * 5);
      }

      if (crop.suitable_soil_types && crop.suitable_soil_types.includes(soil_type)) {
        score += 20;
        reasons.push("Compatible soil type");
      }

      if (temperature >= crop.optimal_temp_min && temperature <= crop.optimal_temp_max) {
        score += 20;
        reasons.push("Ideal temperature");
      } else {
        const tempDiff = Math.min(
          Math.abs(temperature - crop.optimal_temp_min),
          Math.abs(temperature - crop.optimal_temp_max)
        );
        score += Math.max(0, 20 - tempDiff * 2);
      }

      if (humidity >= crop.optimal_humidity_min && humidity <= crop.optimal_humidity_max) {
        score += 15;
        reasons.push("Suitable humidity");
      } else {
        const humDiff = Math.min(
          Math.abs(humidity - crop.optimal_humidity_min),
          Math.abs(humidity - crop.optimal_humidity_max)
        );
        score += Math.max(0, 15 - humDiff * 0.5);
      }

      if (rainfall >= crop.optimal_rainfall_min && rainfall <= crop.optimal_rainfall_max) {
        score += 15;
        reasons.push("Adequate rainfall");
      } else {
        const rainDiff = Math.min(
          Math.abs(rainfall - crop.optimal_rainfall_min),
          Math.abs(rainfall - crop.optimal_rainfall_max)
        );
        score += Math.max(0, 15 - rainDiff * 0.01);
      }

      if (crop.season === season || crop.season === "Year-round") {
        score += 5;
        reasons.push("Appropriate season");
      }

      return {
        name: crop.name,
        score: Math.min(100, Math.max(0, score)),
        reason: reasons.join(", ") || "Check growing conditions",
        description: crop.description,
        growth_duration: crop.growth_duration_days,
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