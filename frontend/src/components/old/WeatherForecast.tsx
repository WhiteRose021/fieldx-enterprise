import React from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind } from 'lucide-react';

const WeatherForecast = ({ forecast }) => {
  // Helper function to get the appropriate weather icon
  const getWeatherIcon = (condition) => {
    const code = condition?.code;
    const isDay = condition?.is_day;
    
    // Map weather codes to icons
    if (code >= 1000 && code <= 1003) {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    } else if (code >= 1004 && code <= 1009) {
      return <Cloud className="w-8 h-8 text-gray-500" />;
    } else if (code >= 1150 && code <= 1201) {
      return <CloudDrizzle className="w-8 h-8 text-blue-400" />;
    } else if (code >= 1202 && code <= 1207) {
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    } else if (code >= 1210 && code <= 1237) {
      return <CloudSnow className="w-8 h-8 text-blue-200" />;
    } else if (code >= 1273 && code <= 1282) {
      return <CloudLightning className="w-8 h-8 text-yellow-400" />;
    } else {
      return <Wind className="w-8 h-8 text-gray-400" />;
    }
  };

  // Helper function to format date
  const formatDate = (date) => {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return new Date(date).toLocaleDateString('el-GR', options);
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Πρόγνωση Καιρού 5 Ημερών</h2>
      
      <div className="grid grid-cols-5 gap-4">
        {forecast?.forecastday?.map((day) => (
          <div
            key={day.date}
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">
                {formatDate(day.date)}
              </p>
              
              <div className="flex justify-center mb-3">
                {getWeatherIcon(day.day.condition)}
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-800">
                  {Math.round(day.day.avgtemp_c)}°C
                </p>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>↓ {Math.round(day.day.mintemp_c)}°</span>
                  <span>↑ {Math.round(day.day.maxtemp_c)}°</span>
                </div>
                
                <p className="text-xs text-gray-600 mt-2">
                  {day.day.condition.text}
                </p>
                
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Υγρασία: {day.day.avghumidity}%
                  </p>
                  <p className="text-xs text-gray-500">
                    Βροχή: {day.day.daily_chance_of_rain}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherForecast;