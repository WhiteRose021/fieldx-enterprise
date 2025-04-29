"use client";

import React, { useState, useEffect } from "react";
import { Sun, Cloud, CloudRain, CloudDrizzle, Wind, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeatherForecastProps {
  latitude?: number;
  longitude?: number;
}

interface WeatherData {
  day: string;
  date: string;
  icon: React.ReactNode;
  condition: string;
  high: number;
  low: number;
  precipitation: string;
  impact: string;
}

export function WeatherForecast({ latitude, longitude }: WeatherForecastProps) {
  const [forecast, setForecast] = useState<WeatherData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!latitude || !longitude) {
        setIsLoading(false);
        setError("Δεν έχουν καταχωρηθεί συντεταγμένες");
        return;
      }

      try {
        setIsLoading(true);
        
        // In a real implementation, you would fetch from a weather API
        // For now, we'll simulate a response with generated data based on coordinates
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Generate mock data based on latitude/longitude (deterministic for same coordinates)
        const seed = (latitude * 1000 + longitude * 100) % 100;
        const today = new Date();
        
        // Generate weather patterns influenced by the coordinates
        const seedValue = seed / 100;
        const weatherPattern = seedValue < 0.3 ? "sunny" : 
                              seedValue < 0.6 ? "mixed" : 
                              seedValue < 0.9 ? "rainy" : "windy";
        
        const getTemperature = (baseTemp: number, variance: number) => {
          return Math.round(baseTemp + (seedValue * variance * 2 - variance));
        };
        
        const getWeatherDay = (dayOffset: number): WeatherData => {
          const date = new Date(today);
          date.setDate(today.getDate() + dayOffset);
          
          // Get day name in Greek
          const dayName = date.toLocaleDateString('el-GR', { weekday: 'long' });
          const dayShort = date.toLocaleDateString('el-GR', { day: '2-digit', month: 'short' });
          
          // Deterministic but varying weather for each day
          const daySeed = (seed + dayOffset * 10) % 100 / 100;
          
          let condition: string;
          let icon: React.ReactNode;
          let precipitation: string;
          let impact: string;
          
          // Base weather on overall pattern but with daily variations
          if (weatherPattern === "sunny") {
            if (daySeed < 0.7) {
              condition = "Ηλιοφάνεια";
              icon = <Sun className="h-6 w-6 text-yellow-500" />;
              precipitation = "0%";
              impact = "None";
            } else {
              condition = "Μερικώς Συννεφιασμένο";
              icon = <Cloud className="h-6 w-6 text-gray-500" />;
              precipitation = "10%";
              impact = "None";
            }
          } else if (weatherPattern === "mixed") {
            if (daySeed < 0.4) {
              condition = "Ηλιοφάνεια";
              icon = <Sun className="h-6 w-6 text-yellow-500" />;
              precipitation = "0%";
              impact = "None";
            } else if (daySeed < 0.8) {
              condition = "Μερικώς Συννεφιασμένο";
              icon = <Cloud className="h-6 w-6 text-gray-500" />;
              precipitation = "20%";
              impact = "Low";
            } else {
              condition = "Ψιχάλα";
              icon = <CloudDrizzle className="h-6 w-6 text-blue-400" />;
              precipitation = "40%";
              impact = "Low";
            }
          } else if (weatherPattern === "rainy") {
            if (daySeed < 0.3) {
              condition = "Μερικώς Συννεφιασμένο";
              icon = <Cloud className="h-6 w-6 text-gray-500" />;
              precipitation = "30%";
              impact = "Low";
            } else if (daySeed < 0.7) {
              condition = "Ψιχάλα";
              icon = <CloudDrizzle className="h-6 w-6 text-blue-400" />;
              precipitation = "60%";
              impact = "Moderate";
            } else {
              condition = "Βροχή";
              icon = <CloudRain className="h-6 w-6 text-blue-500" />;
              precipitation = "80%";
              impact = "High";
            }
          } else { // windy
            if (daySeed < 0.3) {
              condition = "Άνεμοι";
              icon = <Wind className="h-6 w-6 text-gray-600" />;
              precipitation = "0%";
              impact = "Moderate";
            } else if (daySeed < 0.6) {
              condition = "Μερικώς Συννεφιασμένο με Ανέμους";
              icon = <Wind className="h-6 w-6 text-gray-600" />;
              precipitation = "10%";
              impact = "Moderate";
            } else {
              condition = "Βροχή με Ανέμους";
              icon = <CloudRain className="h-6 w-6 text-blue-500" />;
              precipitation = "70%";
              impact = "High";
            }
          }
          
          // Determine base temperature from latitude (rough approximation)
          const baseTemp = Math.max(5, Math.min(35, 30 - Math.abs(latitude - 38) * 2));
          
          // Temperature range influenced by weather pattern
          let tempVariance = 4;
          if (weatherPattern === "rainy") tempVariance = 3;
          if (weatherPattern === "windy") tempVariance = 5;
          
          const highTemp = getTemperature(baseTemp, tempVariance);
          const lowTemp = getTemperature(baseTemp - 8, tempVariance);
          
          return {
            day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
            date: dayShort,
            icon,
            condition,
            high: highTemp,
            low: lowTemp,
            precipitation,
            impact
          };
        };
        
        // Generate 5-day forecast
        const mockForecast = [0, 1, 2, 3, 4].map(getWeatherDay);
        
        setForecast(mockForecast);
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error("Error fetching weather:", err);
        setIsLoading(false);
        setError("Σφάλμα κατά τη λήψη δεδομένων καιρού");
      }
    };

    fetchWeather();
  }, [latitude, longitude]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        <p className="text-sm text-muted-foreground">Φόρτωση πρόγνωσης καιρού...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <p className="text-sm text-muted-foreground mb-2">{error}</p>
        <Button size="sm" variant="outline">Δοκιμάστε ξανά</Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {forecast.map((day, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {day.icon}
            <div>
              <p className="font-medium text-sm">{day.day}</p>
              <p className="text-xs text-muted-foreground">{day.date}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm">{day.condition}</p>
            <p className="text-xs">
              {day.high}°C / {day.low}°C
            </p>
            <div
              className={`text-xs ${
                day.impact === "None" ? "text-green-500" : 
                day.impact === "Low" ? "text-yellow-500" : 
                day.impact === "Moderate" ? "text-orange-500" : "text-red-500"
              }`}
            >
              {day.impact === "None" ? "Καμία επίπτωση" : 
               day.impact === "Low" ? "Χαμηλή επίπτωση" : 
               day.impact === "Moderate" ? "Μέτρια επίπτωση" : "Υψηλή επίπτωση"}
            </div>
          </div>
        </div>
      ))}

      <div className="pt-2 text-xs text-muted-foreground">
        <p>Επιπτώσεις καιρικών συνθηκών στις εργασίες:</p>
        <ul className="list-disc list-inside pl-2 pt-1">
          <li>Η βροχή επηρεάζει τις συγκολλήσεις και τις εξωτερικές εργασίες</li>
          <li>Οι ισχυροί άνεμοι μπορεί να καθυστερήσουν τις εναέριες εγκαταστάσεις</li>
          <li>Οι ακραίες θερμοκρασίες επηρεάζουν τη λειτουργία του εξοπλισμού</li>
        </ul>
      </div>
    </div>
  );
}