// lib/services/weather-service.ts
import { useState, useEffect } from 'react';

// Weather API response types
export interface WeatherForecastDay {
  date: string;
  date_epoch: number;
  day: {
    maxtemp_c: number;
    maxtemp_f: number;
    mintemp_c: number;
    mintemp_f: number;
    avgtemp_c: number;
    avgtemp_f: number;
    maxwind_mph: number;
    maxwind_kph: number;
    totalprecip_mm: number;
    totalprecip_in: number;
    totalsnow_cm: number;
    avgvis_km: number;
    avgvis_miles: number;
    avghumidity: number;
    daily_will_it_rain: number;
    daily_chance_of_rain: number;
    daily_will_it_snow: number;
    daily_chance_of_snow: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    uv: number;
  };
  astro: {
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
    moon_phase: string;
    moon_illumination: string;
    is_moon_up: number;
    is_sun_up: number;
  };
  hour: Array<{
    time_epoch: number;
    time: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    windchill_c: number;
    windchill_f: number;
    heatindex_c: number;
    heatindex_f: number;
    dewpoint_c: number;
    dewpoint_f: number;
    will_it_rain: number;
    chance_of_rain: number;
    will_it_snow: number;
    chance_of_snow: number;
    vis_km: number;
    vis_miles: number;
    gust_mph: number;
    gust_kph: number;
    uv: number;
  }>;
}

export interface WeatherForecastResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
    gust_mph: number;
    gust_kph: number;
  };
  forecast: {
    forecastday: WeatherForecastDay[];
  };
}

interface UseWeatherResult {
  weatherData: WeatherForecastResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// The API key should be stored in environment variables
const API_KEY = process.env.NEXT_PUBLIC_WEATHERAPI_KEY || '';

/**
 * Custom hook to fetch weather data from WeatherAPI.com
 */
export function useWeather(latitude: string | null, longitude: string | null, days = 3): UseWeatherResult {
  const [weatherData, setWeatherData] = useState<WeatherForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const refetch = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // Don't fetch if coordinates are missing or invalid
    if (!latitude || !longitude || 
        isNaN(parseFloat(latitude)) || 
        isNaN(parseFloat(longitude))) {
      setError(new Error('Invalid coordinates'));
      return;
    }

    const fetchWeatherData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use your API key here
        const apiKey = API_KEY;
        if (!apiKey) {
          throw new Error('Weather API key is missing. Please set NEXT_PUBLIC_WEATHERAPI_KEY in your environment.');
        }

        const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${latitude},${longitude}&days=${days}&aqi=no&alerts=no`;
        
        console.log(`Fetching weather data from: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
        }
        
        const data: WeatherForecastResponse = await response.json();
        console.log('Weather data fetched successfully', { 
          location: data.location.name,
          current: data.current.temp_c,
          forecast_days: data.forecast.forecastday.length
        });
        
        setWeatherData(data);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch weather data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherData();
  }, [latitude, longitude, days, refreshTrigger]);

  return { weatherData, isLoading, error, refetch };
}

/**
 * Direct function to fetch weather data (not a hook)
 */
export async function fetchWeatherData(
  latitude: string, 
  longitude: string, 
  apiKey: string, 
  days = 3
): Promise<WeatherForecastResponse> {
  if (!latitude || !longitude || !apiKey) {
    throw new Error('Missing required parameters: latitude, longitude, or API key');
  }

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${latitude},${longitude}&days=${days}&aqi=no&alerts=no`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}