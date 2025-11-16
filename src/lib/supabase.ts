import { createClient } from '@supabase/supabase-js';

const supabaseUrlString = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrlString, supabaseAnonKey);
export const supabaseUrl = supabaseUrlString;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          location: string | null;
          farm_size: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          location?: string | null;
          farm_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          location?: string | null;
          farm_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      crops: {
        Row: {
          id: string;
          name: string;
          scientific_name: string | null;
          description: string | null;
          season: string | null;
          optimal_ph_min: number;
          optimal_ph_max: number;
          optimal_temp_min: number;
          optimal_temp_max: number;
          optimal_humidity_min: number;
          optimal_humidity_max: number;
          optimal_rainfall_min: number;
          optimal_rainfall_max: number;
          suitable_soil_types: string[] | null;
          growth_duration_days: number;
          created_at: string;
        };
      };
      recommendations: {
        Row: {
          id: string;
          user_id: string | null;
          soil_ph: number;
          soil_type: string;
          temperature: number;
          humidity: number;
          air_quality: number;
          rainfall: number;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          season: string | null;
          recommended_crops: any;
          confidence_score: number;
          created_at: string;
        };
      };
      price_predictions: {
        Row: {
          id: string;
          user_id: string | null;
          crop_name: string;
          current_price: number;
          predicted_price: number;
          prediction_date: string;
          market_location: string | null;
          created_at: string;
        };
      };
      government_schemes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          eligibility: string | null;
          benefits: string | null;
          application_link: string | null;
          state: string | null;
          category: string | null;
          is_active: boolean;
          created_at: string;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string | null;
          subject: string;
          message: string;
          status: string;
          priority: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};