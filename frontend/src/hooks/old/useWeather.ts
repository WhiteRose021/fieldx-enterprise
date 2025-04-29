import { useState, useEffect } from 'react';
import type { WeatherResponse } from '@/types/weather';

const WEATHER_API_KEY = 'fc49117122e5499fa1b151720252001';
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';

interface UseWeatherProps {
  latitude: string | null;
  longitude: string | null;
  enabled?: boolean;
}

export const useWeather = ({ latitude, longitude, enabled = true }: UseWeatherProps) => {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      // Reset states
      setError(null);
      setLoading(true);

      try {
        // Validate coordinates
        if (!latitude || !longitude) {
          throw new Error('Coordinates are required');
        }

        // Construct API URL
        const url = new URL(`${WEATHER_API_BASE_URL}/forecast.json`);
        url.searchParams.append('key', WEATHER_API_KEY);
        url.searchParams.append('q', `${latitude},${longitude}`);
        url.searchParams.append('days', '5');
        url.searchParams.append('aqi', 'no');
        url.searchParams.append('lang', 'el'); // Greek language support

        // Make API request
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch weather data');
        }

        const data: WeatherResponse = await response.json();
        setWeather(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (enabled && latitude && longitude) {
      fetchWeather();

      // Refresh weather data every 30 minutes
      const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [latitude, longitude, enabled]);

  // Manual refresh function
  const refresh = async () => {
    setError(null);
    setLoading(true);

    try {
      const url = new URL(`${WEATHER_API_BASE_URL}/forecast.json`);
      url.searchParams.append('key', WEATHER_API_KEY);
      url.searchParams.append('q', `${latitude},${longitude}`);
      url.searchParams.append('days', '5');
      url.searchParams.append('aqi', 'no');
      url.searchParams.append('lang', 'el');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch weather data');
      }

      const data: WeatherResponse = await response.json();
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    weather,
    loading,
    error,
    refresh
  };
};