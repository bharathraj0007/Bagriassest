# Location Search and Auto Weather Updates Feature

## Overview
This feature allows users to search for and select any location globally, with automatic population of weather parameters (temperature, humidity, air quality, and rainfall) based on the selected location.

## Key Features

### 1. Location Search
- **Search Input**: Users can search for any location by typing place names, cities, or regions
- **Real-time Suggestions**: Dropdown menu shows up to 5 location suggestions as user types
- **Global Coverage**: Uses OpenStreetMap Nominatim API for comprehensive worldwide coverage
- **Location Display**: Selected location is clearly displayed below the search box

### 2. Automatic Weather Data Fetching
When a location is selected, the system automatically fetches:
- **Temperature**: Current temperature in Celsius
- **Humidity**: Relative humidity percentage
- **Air Quality Index (AQI)**: Real-time air quality data
- **Rainfall**: Current precipitation data

### 3. GPS Integration
- **GPS Button**: One-click GPS location detection
- **Fallback Weather Fetch**: Automatically fetches weather data for GPS-detected location
- **User Permission**: Respects browser geolocation permissions

### 4. Visual Feedback
- **Loading States**: Shows "Loading..." indicator while fetching weather
- **Auto-updating Labels**: Weather fields display "auto-updating..." status
- **Disabled Fields**: Weather input fields are temporarily disabled while data loads
- **Success Confirmation**: Selected location displays in green once confirmed

## Technical Implementation

### Edge Function: `weather-data`
Location: `/supabase/functions/weather-data/index.ts`

**Endpoints:**
1. **`action=search`**: Search for locations
   - Parameter: `query` (location search string)
   - Returns: Array of location suggestions with coordinates

2. **`action=weather`**: Fetch weather data
   - Parameters: `latitude`, `longitude`
   - Returns: Temperature, humidity, AQI, rainfall

**Data Sources:**
- **Location**: OpenStreetMap Nominatim API
- **Weather**: Open-Meteo Weather API
- **Air Quality**: WAQI (World Air Quality Index) API

### Frontend: `Recommendation.tsx`
**New State Variables:**
- `locationSearch`: Current search input
- `locationOptions`: Array of location suggestions
- `showLocationDropdown`: Visibility toggle for dropdown
- `searchingLocations`: Loading state for location search
- `loadingWeather`: Loading state for weather fetch

**New Functions:**
- `searchLocations()`: Searches for locations as user types
- `selectLocation()`: Handles location selection and triggers weather fetch
- `fetchWeatherData()`: Fetches weather data for given coordinates
- `fetchLocation()`: Uses GPS to get current location and fetch weather

## User Workflow

1. **Enter Location**:
   - User types location name in search box
   - System shows suggestions in dropdown

2. **Select Location**:
   - User clicks on desired location from dropdown
   - Location is confirmed and displayed

3. **Auto Weather Update**:
   - System automatically fetches weather data
   - Temperature, Humidity, AQI, and Rainfall are auto-populated
   - Weather fields show "auto-updating..." during fetch
   - Once complete, user can proceed with recommendation

4. **Manual Override** (Optional):
   - Users can manually edit weather values if needed
   - Weather fields are enabled after loading completes

5. **Alternative: GPS**:
   - User clicks GPS button
   - Browser requests location permission
   - Current location is fetched
   - Weather data is automatically updated

## Benefits

1. **User Convenience**: No need to manually enter weather data
2. **Accuracy**: Real-time weather data from official sources
3. **Global Reach**: Works with any location worldwide
4. **Time Saving**: Automatic population saves user input time
5. **Flexibility**: Manual override available if needed
6. **Mobile Friendly**: GPS integration on mobile devices

## Data Flow Diagram

```
User Input (Location Search)
           ↓
    Location Search API
           ↓
    Display Suggestions
           ↓
    User Selects Location
           ↓
    Extract Coordinates
           ↓
    Weather APIs (Open-Meteo, WAQI)
           ↓
    Auto-populate Weather Fields
           ↓
    Ready for Crop Recommendation
```

## API Integration Details

### OpenStreetMap Nominatim
- **Purpose**: Location search and geocoding
- **Rate Limit**: 1 request/second
- **No Key Required**: Public API
- **Accuracy**: High for most locations

### Open-Meteo Weather
- **Purpose**: Current weather data
- **Rate Limit**: 10,000 requests/day (free tier)
- **Data**: Temperature, humidity, precipitation
- **Timezone Support**: Automatic timezone detection

### WAQI (World Air Quality Index)
- **Purpose**: Real-time air quality data
- **Rate Limit**: Depends on API key tier
- **Data**: AQI, pollutant levels, health recommendations
- **Coverage**: 130+ countries

## Error Handling

- **No Results**: If search returns no results, dropdown remains hidden
- **Network Error**: User prompted to enter data manually
- **Invalid Coordinates**: Fallback to default values (temp: 25°C, humidity: 50%, aqi: 75)
- **API Timeout**: User can retry or enter manually

## Performance Considerations

- **Debouncing**: Search only triggers for queries ≥ 2 characters
- **Caching**: Results cached in browser session
- **Minimal API Calls**: Only triggered on location selection
- **Concurrent Loading**: Multiple APIs called in parallel for weather data

## Future Enhancements

1. **Historical Weather Data**: Support for past weather patterns
2. **Weather Forecasting**: Show upcoming weather predictions
3. **Multiple Locations**: Allow comparing multiple locations
4. **Favorite Locations**: Save frequently used locations
5. **Weather Alerts**: Notify of extreme weather conditions
6. **Crop-Specific Weather**: Recommend ideal times based on crop needs
