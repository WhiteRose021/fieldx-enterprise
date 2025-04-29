// components/WeatherForecast/WeatherForecast.tsx
import React, { useState } from 'react';
import { useWeather, WeatherForecastResponse } from '@/services/weather-service';
import { Cloud, CloudRain, Loader2, AlertCircle, Sun, Droplets, Wind, ThermometerSun, BarChart4, RefreshCw } from 'lucide-react';

interface WeatherForecastProps {
  latitude: string | null;
  longitude: string | null;
  locationName?: string;
  apiKey?: string;
  className?: string;
}

const getWeatherIcon = (code: number, isDay: number) => {
  // Based on WeatherAPI.com condition codes
  // This is a simplified mapping - you can expand this based on all the possible codes
  if (code >= 1000 && code < 1003) { // Sunny or partly cloudy
    return <Sun className="h-8 w-8 text-yellow-500" />;
  } else if (code >= 1003 && code < 1063) { // Cloudy variants
    return <Cloud className="h-8 w-8 text-gray-500" />;
  } else if (code >= 1063 && code < 1180) { // Rainy variants
    return <CloudRain className="h-8 w-8 text-blue-500" />;
  } else if (code >= 1180 && code < 1240) { // Rain
    return <Droplets className="h-8 w-8 text-blue-600" />;
  } else {
    return <Cloud className="h-8 w-8 text-gray-500" />; // Default
  }
};

export const WeatherForecast: React.FC<WeatherForecastProps> = ({ 
  latitude, 
  longitude, 
  locationName, 
  className = "" 
}) => {
  const [expanded, setExpanded] = useState(false);
  const { weatherData, isLoading, error, refetch } = useWeather(latitude, longitude, 3);

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('el-GR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 flex items-center justify-center ${className}`}>
        <Loader2 className="h-6 w-6 text-blue-500 animate-spin mr-2" />
        <span className="text-gray-600">Φόρτωση δεδομένων καιρού...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 flex items-center ${className}`}>
        <AlertCircle className="h-6 w-6 text-red-500 mr-2 flex-shrink-0" />
        <div>
          <div className="text-red-800 font-medium">Σφάλμα φόρτωσης δεδομένων καιρού</div>
          <div className="text-sm text-red-600">{error.message}</div>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 flex items-center ${className}`}>
        <Cloud className="h-6 w-6 text-gray-400 mr-2" />
        <span className="text-gray-600">Δεν υπάρχουν διαθέσιμα δεδομένα καιρού</span>
      </div>
    );
  }

  const { current, location, forecast } = weatherData;

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Header with current weather */}
      <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">
            Καιρός - {locationName || location.name}
          </h3>
          <button 
            onClick={() => refetch()} 
            className="p-1.5 hover:bg-blue-700 rounded-full transition-colors"
            aria-label="Ανανέωση δεδομένων καιρού"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center">
            {getWeatherIcon(current.condition.code, current.is_day)}
            <div className="ml-2">
              <div className="text-3xl font-bold">{current.temp_c}°C</div>
              <div className="text-sm opacity-90">{current.condition.text}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end text-sm">
              <Droplets className="h-4 w-4 mr-1" />
              <span>{current.humidity}%</span>
            </div>
            <div className="flex items-center justify-end text-sm mt-1">
              <Wind className="h-4 w-4 mr-1" />
              <span>{current.wind_kph} km/h</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toggle expansion button */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full py-1 px-4 bg-gray-100 hover:bg-gray-200 transition-colors text-sm text-gray-600 flex items-center justify-center"
      >
        {expanded ? 'Απόκρυψη πρόγνωσης' : 'Εμφάνιση 3ήμερης πρόγνωσης'}
        <span className={`ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {/* Forecast days */}
      {expanded && (
        <div className="p-4">
          <div className="grid gap-3">
            {forecast.forecastday.map((day) => (
              <div key={day.date} className="flex items-center justify-between p-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="font-medium">{formatDate(day.date)}</div>
                  <div className="text-xs text-gray-500">{day.day.condition.text}</div>
                </div>
                <div className="flex items-center">
                  {getWeatherIcon(day.day.condition.code, 1)}
                  <div className="ml-2 text-right">
                    <div className="font-medium">{Math.round(day.day.maxtemp_c)}°C</div>
                    <div className="text-xs text-gray-500">{Math.round(day.day.mintemp_c)}°C</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Additional weather info */}
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 rounded p-2">
              <Droplets className="h-5 w-5 mx-auto text-blue-600 mb-1" />
              <div className="text-xs font-medium">Πιθανότητα βροχής</div>
              <div className="text-sm">{forecast.forecastday[0].day.daily_chance_of_rain}%</div>
            </div>
            <div className="bg-yellow-50 rounded p-2">
              <ThermometerSun className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
              <div className="text-xs font-medium">Μέση θερμοκρασία</div>
              <div className="text-sm">{Math.round(forecast.forecastday[0].day.avgtemp_c)}°C</div>
            </div>
            <div className="bg-purple-50 rounded p-2">
              <BarChart4 className="h-5 w-5 mx-auto text-purple-600 mb-1" />
              <div className="text-xs font-medium">Δείκτης UV</div>
              <div className="text-sm">{forecast.forecastday[0].day.uv}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer with attribution */}
      <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">
        <span>Powered by <a href="https://www.weatherapi.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">WeatherAPI.com</a></span>
      </div>
    </div>
  );
};

export default WeatherForecast;