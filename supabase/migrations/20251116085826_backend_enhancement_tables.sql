/*
  Database Migration: Backend Enhancement Tables

  This migration adds new tables required for the enhanced crop recommendation
  and pricing system:
  - price_history: Historical commodity price data for trend analysis
  - weather_cache: Cached weather data to reduce API calls
  - system_logs: Structured logging for monitoring and debugging
*/

-- Create price_history table for storing historical commodity prices
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text NOT NULL,
  market_location text,
  price numeric NOT NULL,
  price_date date NOT NULL,
  source text DEFAULT 'commodities-api',
  currency text DEFAULT 'INR',
  exchange_rate numeric,
  created_at timestamptz DEFAULT now()
);

-- Create weather_cache table for caching external weather API responses
CREATE TABLE IF NOT EXISTS weather_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  temperature numeric,
  humidity numeric,
  rainfall numeric,
  aqi numeric,
  wind_speed numeric,
  data_source text DEFAULT 'open-meteo',
  data_date date NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create system_logs table for structured logging
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  log_level text NOT NULL CHECK (log_level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  request_id text,
  user_id text,
  execution_time_ms numeric,
  created_at timestamptz DEFAULT now()
);

-- Create market_data table for storing real-time market information
CREATE TABLE IF NOT EXISTS market_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text NOT NULL,
  market_location text,
  current_price numeric NOT NULL,
  price_change_24h numeric,
  price_change_7d numeric,
  volume_traded numeric,
  market_source text DEFAULT 'commodities-api',
  last_updated timestamptz DEFAULT now(),
  currency text DEFAULT 'INR',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Price history - anyone can read, only system can write
CREATE POLICY "Anyone can view price history"
  ON price_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert price history"
  ON price_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Weather cache - anyone can read, only system can write
CREATE POLICY "Anyone can view weather cache"
  ON weather_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage weather cache"
  ON weather_cache FOR ALL
  TO authenticated
  WITH CHECK (true);

-- System logs - only system can read/write
CREATE POLICY "System can manage system logs"
  ON system_logs FOR ALL
  TO authenticated
  WITH CHECK (true);

-- Market data - anyone can read, only system can write
CREATE POLICY "Anyone can view market data"
  ON market_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage market data"
  ON market_data FOR ALL
  TO authenticated
  WITH CHECK (true);

-- Performance indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_price_history_crop_date ON price_history(crop_name, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_location_date ON price_history(market_location, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_source ON price_history(source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_weather_cache_location ON weather_cache(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_weather_cache_expires ON weather_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_weather_cache_date ON weather_cache(data_date DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_function_date ON system_logs(function_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level_date ON system_logs(log_level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_request_id ON system_logs(request_id);

CREATE INDEX IF NOT EXISTS idx_market_data_crop ON market_data(crop_name);
CREATE INDEX IF NOT EXISTS idx_market_data_location ON market_data(market_location);
CREATE INDEX IF NOT EXISTS idx_market_data_updated ON market_data(last_updated DESC);

-- Add triggers to automatically clean up old cache data
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM weather_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to clean up expired cache periodically
-- Note: This would need to be set up as a cron job in production
-- COMMENT ON FUNCTION clean_expired_cache IS 'Cleans up expired weather cache entries';

-- Add helpful comments
COMMENT ON TABLE price_history IS 'Stores historical commodity price data for trend analysis and predictions';
COMMENT ON TABLE weather_cache IS 'Caches weather API responses to reduce external API calls and improve performance';
COMMENT ON TABLE system_logs IS 'Structured logging table for monitoring system performance and debugging issues';
COMMENT ON TABLE market_data IS 'Real-time market data for agricultural commodities';