// components/WeatherForecast/MinimalWeatherForecast.tsx
import React, { useState } from 'react';
import { useWeather, WeatherForecastResponse } from '@/services/weather-service';
import { 
  Cloud, CloudRain, Loader2, AlertCircle, Sun, Droplets, 
  Wind, ThermometerSun, RefreshCw, ChevronDown, ChevronUp, 
  Umbrella, Snowflake, CloudSun, CloudFog
} from 'lucide-react';

interface MinimalWeatherForecastProps {
  latitude: string | null;
  longitude: string | null;
  locationName?: string;
  apiKey?: string;
  className?: string;
}

// Improved weather icon mapping
const getWeatherIcon = (code: number, isDay: number, size = 5) => {
  // Map WeatherAPI.com condition codes to appropriate icons
  // Full code list: https://www.weatherapi.com/docs/weather_conditions.json
  if (code === 1000) { // Clear/Sunny
    return isDay ? <Sun className={`h-${size} w-${size} text-yellow-500`} /> : <Sun className={`h-${size} w-${size} text-gray-400`} />;
  } else if (code >= 1003 && code <= 1009) { // Cloudy variants
    return <CloudSun className={`h-${size} w-${size} text-gray-500`} />;
  } else if (code >= 1030 && code <= 1039) { // Fog, mist, etc.
    return <CloudFog className={`h-${size} w-${size} text-gray-400`} />;
  } else if (code >= 1063 && code <= 1069) { // Patchy rain
    return <CloudRain className={`h-${size} w-${size} text-blue-400`} />;
  } else if (code >= 1150 && code <= 1201) { // Drizzle/Rain
    return <CloudRain className={`h-${size} w-${size} text-blue-500`} />;
  } else if (code >= 1204 && code <= 1237) { // Snow
    return <Snowflake className={`h-${size} w-${size} text-blue-300`} />;
  } else if (code >= 1273 && code <= 1282) { // Thunderstorm
    return <CloudRain className={`h-${size} w-${size} text-purple-500`} />;
  } else {
    return <Cloud className={`h-${size} w-${size} text-gray-500`} />;
  }
};

export const MinimalWeatherForecast: React.FC<MinimalWeatherForecastProps> = ({ 
  latitude, 
  longitude, 
  locationName, 
  className = "" 
}) => {
  const [expanded, setExpanded] = useState(false);
  const { weatherData, isLoading, error, refetch } = useWeather(latitude, longitude, 3);

  // Format date - more concise for Greek locale
  const formatDate = (date: string) => {
    const dayNames = ['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ'];
    const monthNames = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαϊ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
    
    const d = new Date(date);
    const day = dayNames[d.getDay()];
    const dayNum = d.getDate();
    const month = monthNames[d.getMonth()];
    
    return `${day} ${dayNum} ${month}`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg p-4 flex items-center justify-center ${className}`}>
        <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
        <span className="text-gray-600 text-sm">Φόρτωση δεδομένων καιρού...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg p-4 flex items-center ${className}`}>
        <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
        <div>
          <div className="text-red-800 font-medium text-sm">Σφάλμα φόρτωσης δεδομένων καιρού</div>
          <div className="text-xs text-red-600">{error.message}</div>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className={`bg-white rounded-lg p-4 flex items-center ${className}`}>
        <Cloud className="h-5 w-5 text-gray-400 mr-2" />
        <span className="text-gray-600 text-sm">Δεν υπάρχουν διαθέσιμα δεδομένα καιρού</span>
      </div>
    );
  }

  const { current, location, forecast } = weatherData;

  return (
    <div className={`bg-white rounded-lg overflow-hidden ${className}`}>
      {/* Current weather - minimal header */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-base text-gray-900">
            Καιρός - {locationName || location.name}
          </h3>
          <button 
            onClick={() => refetch()} 
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            aria-label="Ανανέωση δεδομένων καιρού"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        
        {/* Current weather display - more minimal */}
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            {getWeatherIcon(current.condition.code, current.is_day, 8)}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-gray-900">{Math.round(current.temp_c)}°C</span>
              <span className="text-sm text-gray-500">{current.condition.text}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1 gap-3">
              <div className="flex items-center">
                <Droplets className="h-3.5 w-3.5 mr-1 text-blue-400" />
                <span>{current.humidity}%</span>
              </div>
              <div className="flex items-center">
                <Wind className="h-3.5 w-3.5 mr-1 text-blue-400" />
                <span>{current.wind_kph} km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toggle expansion button - subtle divider */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full py-1.5 text-xs text-gray-500 flex items-center justify-center border-t border-gray-100"
      >
        {expanded ? (
          <>
            <span>Απόκρυψη πρόγνωσης</span>
            <ChevronUp className="h-3.5 w-3.5 ml-1" />
          </>
        ) : (
          <>
            <span>Εμφάνιση πρόγνωσης</span>
            <ChevronDown className="h-3.5 w-3.5 ml-1" />
          </>
        )}
      </button>
      
      {/* Forecast days - minimal design */}
      {expanded && (
        <div className="border-t border-gray-100">
          <div className="grid gap-0 divide-y divide-gray-100">
            {forecast.forecastday.map((day) => (
              <div key={day.date} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  {getWeatherIcon(day.day.condition.code, 1, 5)}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{formatDate(day.date)}</div>
                    <div className="text-xs text-gray-500">{day.day.condition.text}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{Math.round(day.day.maxtemp_c)}°</div>
                  <div className="text-xs text-gray-500">{Math.round(day.day.mintemp_c)}°</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Additional weather info - clean minimal indicators */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 mt-1 border-t border-gray-100">
            <div className="p-2 text-center">
              <div className="flex justify-center mb-1 text-blue-400">
                <Umbrella className="h-4 w-4" />
              </div>
              <div className="text-xs text-gray-500">Πιθανότητα βροχής</div>
              <div className="text-sm font-medium">{forecast.forecastday[0].day.daily_chance_of_rain}%</div>
            </div>
            <div className="p-2 text-center">
              <div className="flex justify-center mb-1 text-orange-400">
                <ThermometerSun className="h-4 w-4" />
              </div>
              <div className="text-xs text-gray-500">Μέση θερμοκρασία</div>
              <div className="text-sm font-medium">{Math.round(forecast.forecastday[0].day.avgtemp_c)}°C</div>
            </div>
            <div className="p-2 text-center">
              <div className="flex justify-center mb-1 text-yellow-500">
                <Sun className="h-4 w-4" />
              </div>
              <div className="text-xs text-gray-500">Δείκτης UV</div>
              <div className="text-sm font-medium">{forecast.forecastday[0].day.uv}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer attribution - very subtle */}
      <div className="p-1.5 text-center text-xs text-gray-400 border-t border-gray-100">
        <a href="https://www.weatherapi.com/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
          WeatherAPI.com
        </a>
      </div>
    </div>
  );
};

export default MinimalWeatherForecast;