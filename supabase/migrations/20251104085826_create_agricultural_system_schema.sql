/*
  # Agricultural Crop Recommendation System Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `phone` (text)
      - `location` (text)
      - `farm_size` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `crops`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `scientific_name` (text)
      - `description` (text)
      - `season` (text)
      - `optimal_ph_min` (numeric)
      - `optimal_ph_max` (numeric)
      - `optimal_temp_min` (numeric)
      - `optimal_temp_max` (numeric)
      - `optimal_humidity_min` (numeric)
      - `optimal_humidity_max` (numeric)
      - `optimal_rainfall_min` (numeric)
      - `optimal_rainfall_max` (numeric)
      - `suitable_soil_types` (text[])
      - `growth_duration_days` (integer)
      - `created_at` (timestamptz)
    
    - `recommendations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `soil_ph` (numeric)
      - `soil_type` (text)
      - `temperature` (numeric)
      - `humidity` (numeric)
      - `air_quality` (numeric)
      - `rainfall` (numeric)
      - `location` (text)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `season` (text)
      - `recommended_crops` (jsonb)
      - `confidence_score` (numeric)
      - `created_at` (timestamptz)
    
    - `price_predictions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `crop_name` (text)
      - `current_price` (numeric)
      - `predicted_price` (numeric)
      - `prediction_date` (date)
      - `market_location` (text)
      - `created_at` (timestamptz)
    
    - `government_schemes`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `eligibility` (text)
      - `benefits` (text)
      - `application_link` (text)
      - `state` (text)
      - `category` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
    
    - `support_tickets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `subject` (text)
      - `message` (text)
      - `status` (text)
      - `priority` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to crops and government schemes
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  phone text,
  location text,
  farm_size numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Crops table
CREATE TABLE IF NOT EXISTS crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  scientific_name text,
  description text,
  season text,
  optimal_ph_min numeric DEFAULT 0,
  optimal_ph_max numeric DEFAULT 14,
  optimal_temp_min numeric DEFAULT 0,
  optimal_temp_max numeric DEFAULT 50,
  optimal_humidity_min numeric DEFAULT 0,
  optimal_humidity_max numeric DEFAULT 100,
  optimal_rainfall_min numeric DEFAULT 0,
  optimal_rainfall_max numeric DEFAULT 5000,
  suitable_soil_types text[],
  growth_duration_days integer DEFAULT 90,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crops"
  ON crops FOR SELECT
  TO authenticated
  USING (true);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  soil_ph numeric NOT NULL,
  soil_type text NOT NULL,
  temperature numeric NOT NULL,
  humidity numeric NOT NULL,
  air_quality numeric NOT NULL,
  rainfall numeric NOT NULL,
  location text,
  latitude numeric,
  longitude numeric,
  season text,
  recommended_crops jsonb DEFAULT '[]'::jsonb,
  confidence_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations"
  ON recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Price predictions table
CREATE TABLE IF NOT EXISTS price_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  crop_name text NOT NULL,
  current_price numeric DEFAULT 0,
  predicted_price numeric DEFAULT 0,
  prediction_date date DEFAULT CURRENT_DATE,
  market_location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE price_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own price predictions"
  ON price_predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own price predictions"
  ON price_predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Government schemes table
CREATE TABLE IF NOT EXISTS government_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  eligibility text,
  benefits text,
  application_link text,
  state text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE government_schemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active government schemes"
  ON government_schemes FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own support tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own support tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own support tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert sample crops data
INSERT INTO crops (name, scientific_name, description, season, optimal_ph_min, optimal_ph_max, optimal_temp_min, optimal_temp_max, optimal_humidity_min, optimal_humidity_max, optimal_rainfall_min, optimal_rainfall_max, suitable_soil_types, growth_duration_days)
VALUES 
  ('Rice', 'Oryza sativa', 'Staple cereal crop grown in flooded fields', 'Kharif', 5.5, 7.0, 20, 35, 70, 90, 1000, 2500, ARRAY['Clay', 'Loamy'], 120),
  ('Wheat', 'Triticum aestivum', 'Major cereal crop for bread making', 'Rabi', 6.0, 7.5, 12, 25, 50, 70, 400, 800, ARRAY['Loamy', 'Sandy Loam'], 110),
  ('Cotton', 'Gossypium', 'Cash crop for fiber production', 'Kharif', 5.8, 8.0, 21, 30, 60, 80, 500, 1200, ARRAY['Black', 'Alluvial'], 150),
  ('Sugarcane', 'Saccharum officinarum', 'Cash crop for sugar production', 'Year-round', 6.0, 7.5, 20, 35, 70, 90, 1500, 2500, ARRAY['Loamy', 'Alluvial'], 300),
  ('Maize', 'Zea mays', 'Versatile cereal crop', 'Kharif', 5.8, 7.0, 18, 32, 60, 80, 500, 1000, ARRAY['Loamy', 'Sandy Loam'], 90),
  ('Soybean', 'Glycine max', 'Legume crop for oil and protein', 'Kharif', 6.0, 7.0, 20, 30, 65, 85, 600, 1200, ARRAY['Loamy', 'Black'], 100),
  ('Potato', 'Solanum tuberosum', 'Vegetable tuber crop', 'Rabi', 5.0, 6.5, 15, 25, 60, 80, 500, 800, ARRAY['Sandy Loam', 'Loamy'], 90),
  ('Tomato', 'Solanum lycopersicum', 'Popular vegetable crop', 'Year-round', 6.0, 7.0, 18, 27, 60, 80, 400, 700, ARRAY['Loamy', 'Sandy Loam'], 70)
ON CONFLICT (name) DO NOTHING;

-- Insert sample government schemes
INSERT INTO government_schemes (title, description, eligibility, benefits, application_link, state, category, is_active)
VALUES
  ('PM-KISAN', 'Pradhan Mantri Kisan Samman Nidhi - Direct income support to farmers', 'All landholding farmers', '₹6000 per year in three installments', 'https://pmkisan.gov.in', 'All India', 'Financial Support', true),
  ('Kisan Credit Card', 'Credit facility for farmers to meet agricultural needs', 'All farmers with land holdings', 'Easy credit access with low interest rates', 'https://www.india.gov.in/kcc', 'All India', 'Credit', true),
  ('Soil Health Card Scheme', 'Provides soil nutrient status and recommendations', 'All farmers', 'Free soil testing and advisory', 'https://soilhealth.dac.gov.in', 'All India', 'Advisory', true),
  ('Pradhan Mantri Fasal Bima Yojana', 'Crop insurance scheme', 'All farmers', 'Insurance coverage for crop loss', 'https://pmfby.gov.in', 'All India', 'Insurance', true)
ON CONFLICT DO NOTHING;