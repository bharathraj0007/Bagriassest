import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface WeatherData {
  temperature: number;
  humidity: number;
  aqi: number;
  rainfall: number;
  location: string;
  latitude: number;
  longitude: number;
}

interface LocationSearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

async function searchLocation(query: string): Promise<LocationSearchResult[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      {
        headers: {
          'User-Agent': 'AgriculturalApp/1.0',
        },
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
}

async function getWeatherData(latitude: number, longitude: number): Promise<Partial<WeatherData>> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation&timezone=auto`
    );
    const data = await response.json();

    if (data.current) {
      return {
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m || 50,
        rainfall: data.current.precipitation || 0,
        aqi: 75,
      };
    }
    return {};
  } catch (error) {
    console.error('Weather API error:', error);
    return {};
  }
}

async function getAQIData(latitude: number, longitude: number): Promise<number> {
  try {
    const response = await fetch(
      `https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=demo`
    );
    const data = await response.json();
    
    if (data.status === 'ok' && data.data && data.data.aqi) {
      return Math.min(500, Math.max(0, parseInt(data.data.aqi)));
    }
    return 75;
  } catch (error) {
    console.error('AQI API error:', error);
    return 75;
  }
}

Deno.serve(async (req: Request) => {
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
        throw new Error('Query parameter is required');
      }

      const results = await searchLocation(query);
      const formattedResults = results.map((r) => ({
        display_name: r.display_name,
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
      }));

      return new Response(
        JSON.stringify({ results: formattedResults }),
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
        throw new Error('Latitude and longitude are required');
      }

      const weatherData = await getWeatherData(latitude, longitude);
      const aqi = await getAQIData(latitude, longitude);

      return new Response(
        JSON.stringify({
          temperature: weatherData.temperature || 25,
          humidity: weatherData.humidity || 50,
          aqi: aqi,
          rainfall: weatherData.rainfall || 0,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
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