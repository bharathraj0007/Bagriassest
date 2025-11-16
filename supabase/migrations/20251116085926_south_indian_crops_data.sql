/*
  Database Migration: South Indian Crops Data

  This migration adds South Indian regional crops to the existing crops table
  to enhance the crop recommendation system with local agricultural varieties.
*/

-- Insert South Indian regional crops with enhanced data
INSERT INTO crops (
  name,
  scientific_name,
  description,
  season,
  optimal_ph_min,
  optimal_ph_max,
  optimal_temp_min,
  optimal_temp_max,
  optimal_humidity_min,
  optimal_humidity_max,
  optimal_rainfall_min,
  optimal_rainfall_max,
  suitable_soil_types,
  growth_duration_days
) VALUES
  -- Spices and Plantation Crops
  ('Black Pepper', 'Piper nigrum', 'Valuable spice crop native to South India, requires high humidity and rainfall', 'Year-round', 5.5, 7.0, 20, 30, 70, 90, 1500, 3000, ARRAY['Red', 'Laterite', 'Loamy', 'Forest'], 210),

  ('Cardamom', 'Elettaria cardamomum', 'Premium spice crop grown in Western Ghats, shade-loving plant', 'Year-round', 5.5, 6.5, 15, 25, 80, 95, 2000, 4000, ARRAY['Forest', 'Loamy', 'Volcanic'], 240),

  ('Coconut', 'Cocos nucifera', 'Tropical palm tree, important for South Indian agriculture and economy', 'Year-round', 5.5, 8.0, 20, 35, 60, 85, 1000, 2500, ARRAY['Sandy', 'Coastal', 'Alluvial', 'Laterite'], 365),

  ('Coffee Arabica', 'Coffea arabica', 'High-quality coffee variety grown in hilly regions of South India', 'Year-round', 6.0, 6.5, 15, 24, 70, 85, 1500, 2500, ARRAY['Forest', 'Volcanic', 'Loamy', 'Red'], 180),

  ('Tea', 'Camellia sinensis', 'Beverage crop grown in high altitude areas with misty conditions', 'Year-round', 4.5, 5.5, 13, 23, 75, 90, 1500, 3500, ARRAY['Forest', 'Volcanic', 'Loamy'], 365),

  -- Medicinal and Aromatic Crops
  ('Turmeric', 'Curcuma longa', 'Golden spice with medicinal properties, rhizome crop', 'Kharif', 5.5, 7.5, 20, 30, 60, 80, 1000, 2000, ARRAY['Loamy', 'Sandy Loam', 'Alluvial', 'Black'], 210),

  ('Ginger', 'Zingiber officinale', 'Aromatic rhizome crop used in cooking and medicine', 'Year-round', 5.5, 6.5, 20, 28, 70, 90, 1200, 2500, ARRAY['Loamy', 'Sandy Loam', 'Red'], 240),

  -- Cash Crops
  ('Cashew Nut', 'Anacardium occidentale', 'Nut crop suited for coastal and laterite soils', 'Year-round', 5.0, 6.5, 22, 35, 65, 85, 1000, 2000, ARRAY['Laterite', 'Coastal', 'Sandy', 'Red'], 270),

  ('Rubber', 'Hevea brasiliensis', 'Industrial crop for latex production, requires consistent rainfall', 'Year-round', 5.0, 6.5, 22, 30, 75, 95, 2000, 3500, ARRAY['Laterite', 'Loamy', 'Red', 'Forest'], 365),

  ('Areca Nut', 'Areca catechu', 'Palm nut crop important in South Indian culture', 'Year-round', 5.0, 6.0, 20, 32, 70, 85, 1500, 3000, ARRAY['Laterite', 'Red', 'Loamy'], 300),

  -- Millets and Pulses (Traditional South Indian Crops)
  ('Finger Millet', 'Eleusine coracana', 'Nutritious millet known as Ragi, drought-resistant crop', 'Kharif', 5.5, 7.0, 18, 32, 50, 70, 600, 1200, ARRAY['Red', 'Laterite', 'Loamy', 'Black'], 90),

  ('Pearl Millet', 'Pennisetum glaucum', 'Hardy millet known as Bajra, extremely drought-tolerant', 'Kharif', 5.5, 7.0, 25, 35, 40, 60, 400, 800, ARRAY['Sandy', 'Sandy Loam', 'Black'], 75),

  ('Red Gram', 'Cajanus cajan', 'Pulse crop known as Tur Dal, important protein source', 'Kharif', 5.5, 7.0, 18, 30, 60, 80, 800, 1500, ARRAY['Red', 'Black', 'Loamy'], 120),

  ('Green Gram', 'Vigna radiata', 'Pulse crop known as Moong Dal, short duration crop', 'Kharif', 6.0, 7.5, 20, 30, 60, 75, 600, 1000, ARRAY['Loamy', 'Sandy Loam', 'Alluvial'], 60),

  ('Black Gram', 'Vigna mungo', 'Pulse crop known as Urad Dal, important in South Indian cuisine', 'Kharif', 5.0, 7.0, 20, 35, 60, 80, 700, 1200, ARRAY['Black', 'Loamy', 'Alluvial'], 75),

  -- Fruits and Vegetables
  ('Mango', 'Mangifera indica', 'King of fruits, tropical fruit crop suitable for South India', 'Summer', 5.5, 7.5, 24, 30, 60, 80, 1000, 2500, ARRAY['Laterite', 'Loamy', 'Sandy', 'Alluvial'], 180),

  ('Banana', 'Musa spp.', 'Tropical fruit crop, high yielding and economically important', 'Year-round', 5.5, 7.0, 20, 30, 65, 85, 1200, 2500, ARRAY['Loamy', 'Alluvial', 'Black', 'Red'], 365),

  ('Tamarind', 'Tamarindus indica', 'Tropical fruit tree, drought-tolerant and long-lived', 'Year-round', 6.0, 8.0, 22, 35, 50, 70, 800, 1500, ARRAY['Laterite', 'Red', 'Sandy'], 270),

  -- Traditional South Indian Varieties
  ('Jackfruit', 'Artocarpus heterophyllus', 'Largest tree-borne fruit, well-suited to humid tropical climate', 'Year-round', 5.5, 7.0, 20, 30, 70, 90, 1500, 2500, ARRAY['Loamy', 'Red', 'Laterite'], 365),

  ('Jamun', 'Syzygium cumini', 'Medicinal fruit tree, adapts to various soil types', 'Year-round', 5.0, 7.0, 20, 32, 60, 80, 1000, 2000, ARRAY['Red', 'Black', 'Loamy'], 270)
ON CONFLICT (name) DO NOTHING;

-- Add comments to describe the new crops
COMMENT ON COLUMN crops.description IS 'Detailed description including cultivation requirements and uses';
COMMENT ON COLUMN crops.suitable_soil_types IS 'Array of soil types where the crop grows well, includes South Indian soil varieties';

-- Create a helper function to get crops by region
CREATE OR REPLACE FUNCTION get_crops_by_region(region_name text)
RETURNS TABLE (
  id uuid,
  name text,
  scientific_name text,
  description text,
  season text,
  growth_duration_days integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.scientific_name,
    c.description,
    c.season,
    c.growth_duration_days
  FROM crops c
  WHERE
    -- South Indian regional crops
    c.name IN (
      'Black Pepper', 'Cardamom', 'Coconut', 'Coffee', 'Tea', 'Turmeric',
      'Ginger', 'Cashew Nut', 'Rubber', 'Areca Nut', 'Finger Millet',
      'Pearl Millet', 'Red Gram', 'Green Gram', 'Black Gram', 'Mango',
      'Banana', 'Tamarind', 'Jackfruit', 'Jamun'
    )
    OR region_name = 'all'  -- Return all crops if 'all' is specified
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get crops suitable for specific South Indian soil types
CREATE OR REPLACE FUNCTION get_crops_for_south_indian_soil(soil_type text)
RETURNS TABLE (
  id uuid,
  name text,
  suitability_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    CASE
      WHEN soil_type = ANY(c.suitable_soil_types) THEN 1.0
      WHEN soil_type IN ('Red', 'Laterite', 'Black', 'Coastal', 'Saline') AND
           c.suitable_soil_types && ARRAY['Red', 'Laterite', 'Black', 'Coastal', 'Saline'] THEN 0.7
      ELSE 0.3
    END as suitability_score
  FROM crops c
  WHERE c.suitable_soil_types IS NOT NULL
  ORDER BY suitability_score DESC, c.name;
END;
$$ LANGUAGE plpgsql;

-- Create a view for South Indian seasonal crops
CREATE OR REPLACE VIEW south_indian_seasonal_crops AS
SELECT
  name,
  scientific_name,
  season,
  optimal_temp_min,
  optimal_temp_max,
  optimal_humidity_min,
  optimal_humidity_max,
  optimal_rainfall_min,
  optimal_rainfall_max,
  suitable_soil_types,
  growth_duration_days
FROM crops
WHERE name IN (
  'Black Pepper', 'Cardamom', 'Coconut', 'Coffee', 'Tea', 'Turmeric',
  'Ginger', 'Cashew Nut', 'Rubber', 'Areca Nut', 'Finger Millet',
  'Pearl Millet', 'Red Gram', 'Green Gram', 'Black Gram', 'Mango',
  'Banana', 'Tamarind', 'Jackfruit', 'Jamun'
);

COMMENT ON VIEW south_indian_seasonal_crops IS 'View containing South Indian regional crops with their cultivation requirements';