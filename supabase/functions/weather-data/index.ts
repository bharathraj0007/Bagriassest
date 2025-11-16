import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// API configurations
const WAQI_API_KEY = Deno.env.get("WAQI_API_KEY") || "demo"; // Replace with production key
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// Cache configuration
const WEATHER_CACHE_TTL = 3600; // 1 hour
const AQI_CACHE_TTL = 7200; // 2 hours
const LOCATION_CACHE_TTL = 86400; // 24 hours

// In-memory cache for serverless functions
const cache = new Map<string, { data: any; expires: number }>();

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  pressure: number;
  location: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  forecast?: Array<{
    date: string;
    temperature_max: number;
    temperature_min: number;
    precipitation_probability: number;
    humidity: number;
  }>;
}

interface LocationSearchResult {
  display_name: string;
  latitude: number;
  longitude: number;
  importance?: number;
  state?: string;
  country?: string;
}

interface AQIData {
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  station_name: string;
  timestamp: string;
}

// Cache helper functions
function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any, ttl: number): void {
  cache.set(key, { data, expires: Date.now() + (ttl * 1000) });
}

// Logging function
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

// Enhanced location search with caching
async function searchLocation(query: string): Promise<LocationSearchResult[]> {
  try {
    const cacheKey = `location_search_${query}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
      {
        headers: {
          'User-Agent': 'AgriculturalApp/1.0 (weather-data-function)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Location search failed: ${response.status}`);
    }

    const data = await response.json();
    const results: LocationSearchResult[] = data.map((r: any) => ({
      display_name: r.display_name,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      importance: r.importance || 0,
      state: r.address?.state || '',
      country: r.address?.country || ''
    }));

    setCachedData(cacheKey, results, LOCATION_CACHE_TTL);
    return results;
  } catch (error) {
    console.error('Location search error:', error);
    await logSystemEvent("weather-data", "ERROR", "Location search failed", {
      query: query,
      error: error.message
    });
    return [];
  }
}

// Enhanced weather data with caching and forecast
async function getWeatherData(latitude: number, longitude: number): Promise<Partial<WeatherData>> {
  try {
    const cacheKey = `weather_${latitude}_${longitude}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    // Get current weather and 7-day forecast
    const response = await fetch(
      `${OPEN_METEO_BASE}/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,pressure_msl` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,relative_humidity_2m_mean` +
      `&timezone=auto&forecast_days=7`,
      {
        headers: {
          'User-Agent': 'AgriculturalApp/1.0 (weather-data-function)',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Weather API failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.current && data.daily) {
      const weatherData: Partial<WeatherData> = {
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m || 50,
        rainfall: data.current.precipitation || 0,
        wind_speed: data.current.wind_speed_10m || 0,
        pressure: data.current.pressure_msl || 1013,
        latitude: latitude,
        longitude: longitude,
        timestamp: new Date().toISOString(),
        forecast: data.daily.time.slice(0, 7).map((date: string, index: number) => ({
          date: date,
          temperature_max: Math.round(data.daily.temperature_2m_max[index]),
          temperature_min: Math.round(data.daily.temperature_2m_min[index]),
          precipitation_probability: Math.round(data.daily.precipitation_probability_mean[index]),
          humidity: Math.round(data.daily.relative_humidity_2m_mean[index])
        }))
      };

      setCachedData(cacheKey, weatherData, WEATHER_CACHE_TTL);
      return weatherData;
    }

    throw new Error('Invalid weather data structure');
  } catch (error) {
    console.error('Weather API error:', error);
    await logSystemEvent("weather-data", "ERROR", "Weather data fetch failed", {
      latitude: latitude,
      longitude: longitude,
      error: error.message
    });

    // Return fallback data
    return {
      temperature: 25,
      humidity: 60,
      rainfall: 0,
      wind_speed: 5,
      pressure: 1013,
      latitude: latitude,
      longitude: longitude,
      timestamp: new Date().toISOString()
    };
  }
}

// Enhanced AQI data with proper API key and caching
async function getAQIData(latitude: number, longitude: number): Promise<AQIData> {
  try {
    const cacheKey = `aqi_${latitude}_${longitude}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    // Round coordinates to 2 decimal places for better caching
    const roundedLat = Math.round(latitude * 100) / 100;
    const roundedLon = Math.round(longitude * 100) / 100;

    const response = await fetch(
      `https://api.waqi.info/feed/geo:${roundedLat};${roundedLon}/?token=${WAQI_API_KEY}`,
      {
        headers: {
          'User-Agent': 'AgriculturalApp/1.0 (weather-data-function)',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`AQI API failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'ok' && data.data) {
      const aqiData: AQIData = {
        aqi: Math.min(500, Math.max(0, parseInt(data.data.aqi) || 75)),
        pm25: parseFloat(data.data.iaqi?.pm25?.v || '0'),
        pm10: parseFloat(data.data.iaqi?.pm10?.v || '0'),
        o3: parseFloat(data.data.iaqi?.o3?.v || '0'),
        no2: parseFloat(data.data.iaqi?.no2?.v || '0'),
        so2: parseFloat(data.data.iaqi?.so2?.v || '0'),
        co: parseFloat(data.data.iaqi?.co?.v || '0'),
        station_name: data.data.city?.name || 'Unknown',
        timestamp: new Date().toISOString()
      };

      setCachedData(cacheKey, aqiData, AQI_CACHE_TTL);
      return aqiData;
    }

    // Fallback AQI data
    const fallbackData: AQIData = {
      aqi: 75,
      pm25: 25,
      pm10: 35,
      o3: 40,
      no2: 20,
      so2: 10,
      co: 0.5,
      station_name: 'Estimated',
      timestamp: new Date().toISOString()
    };

    setCachedData(cacheKey, fallbackData, AQI_CACHE_TTL / 2); // Shorter cache for fallback
    return fallbackData;
  } catch (error) {
    console.error('AQI API error:', error);
    await logSystemEvent("weather-data", "ERROR", "AQI data fetch failed", {
      latitude: latitude,
      longitude: longitude,
      error: error.message
    });

    // Return fallback AQI data
    return {
      aqi: 75,
      pm25: 25,
      pm10: 35,
      o3: 40,
      no2: 20,
      so2: 10,
      co: 0.5,
      station_name: 'Fallback Estimate',
      timestamp: new Date().toISOString()
    };
  }
}

// Store weather data in cache database
async function storeWeatherCache(weatherData: Partial<WeatherData>, aqiData: AQIData): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("weather_cache").insert({
      latitude: weatherData.latitude,
      longitude: weatherData.longitude,
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      rainfall: weatherData.rainfall,
      aqi: aqiData.aqi,
      wind_speed: weatherData.wind_speed,
      data_source: 'open-meteo',
      data_date: new Date().toISOString().split('T')[0],
      expires_at: new Date(Date.now() + WEATHER_CACHE_TTL * 1000).toISOString()
    });
  } catch (error) {
    console.error("Error storing weather cache:", error);
  }
}

// Retry mechanism with exponential backoff
async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetcher();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) break;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

Deno.serve(async (req: Request) => {
  const functionName = "weather-data";
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'search') {
      const query = url.searchParams.get('query');
      if (!query) {
        return new Response(
          JSON.stringify({ error: 'Query parameter is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const results = await fetchWithRetry(() => searchLocation(query));

      await logSystemEvent(functionName, "INFO", "Location search completed", {
        query: query,
        results_count: results.length,
        request_id: requestId
      });

      return new Response(
        JSON.stringify({ results }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (action === 'weather') {
      const latitude = parseFloat(url.searchParams.get('latitude') || '0');
      const longitude = parseFloat(url.searchParams.get('longitude') || '0');

      if (latitude === 0 && longitude === 0) {
        return new Response(
          JSON.stringify({ error: 'Valid latitude and longitude are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const [weatherData, aqiData] = await Promise.all([
        fetchWithRetry(() => getWeatherData(latitude, longitude)),
        fetchWithRetry(() => getAQIData(latitude, longitude))
      ]);

      // Store in database cache
      await storeWeatherCache(weatherData, aqiData);

      const result = {
        current: {
          temperature: weatherData.temperature || 25,
          humidity: weatherData.humidity || 50,
          rainfall: weatherData.rainfall || 0,
          wind_speed: weatherData.wind_speed || 0,
          pressure: weatherData.pressure || 1013,
          aqi: aqiData.aqi,
          aqi_breakdown: {
            pm25: aqiData.pm25,
            pm10: aqiData.pm10,
            o3: aqiData.o3,
            no2: aqiData.no2,
            so2: aqiData.so2,
            co: aqiData.co
          },
          station_name: aqiData.station_name,
          air_quality_status: aqiData.aqi <= 50 ? "Good" :
                              aqiData.aqi <= 100 ? "Moderate" :
                              aqiData.aqi <= 150 ? "Unhealthy for Sensitive Groups" :
                              aqiData.aqi <= 200 ? "Unhealthy" :
                              aqiData.aqi <= 300 ? "Very Unhealthy" : "Hazardous"
        },
        forecast: weatherData.forecast || [],
        location: {
          latitude: latitude,
          longitude: longitude,
          timestamp: weatherData.timestamp
        }
      };

      await logSystemEvent(functionName, "INFO", "Weather data retrieved successfully", {
        latitude: latitude,
        longitude: longitude,
        temperature: result.current.temperature,
        aqi: result.current.aqi,
        request_id: requestId
      });

      return new Response(
        JSON.stringify(result),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (action === 'health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          cache_size: cache.size,
          request_id: requestId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Supported actions: search, weather, health' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Critical error in weather data:', error);

    await logSystemEvent(functionName, "ERROR", "Critical error in weather data function", {
      error: error.message,
      stack: error.stack,
      request_id: requestId
    });

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        request_id: requestId
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});