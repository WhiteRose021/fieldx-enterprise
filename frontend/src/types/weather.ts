// Weather API Response Types
interface WeatherCondition {
    text: string;
    icon: string;
    code: number;
  }
  
  interface DayForecast {
    maxtemp_c: number;
    mintemp_c: number;
    avgtemp_c: number;
    maxwind_kph: number;
    totalprecip_mm: number;
    avghumidity: number;
    daily_chance_of_rain: number;
    condition: WeatherCondition;
  }
  
  interface ForecastDay {
    date: string;
    day: DayForecast;
    astro: {
      sunrise: string;
      sunset: string;
    };
  }
  
  interface WeatherForecast {
    forecastday: ForecastDay[];
  }
  
  interface WeatherResponse {
    location: {
      name: string;
      region: string;
      country: string;
      lat: number;
      lon: number;
      localtime: string;
    };
    current: {
      temp_c: number;
      condition: WeatherCondition;
      wind_kph: number;
      humidity: number;
      cloud: number;
      feelslike_c: number;
    };
    forecast: WeatherForecast;
  }
  
  export type { WeatherResponse, WeatherForecast, ForecastDay, WeatherCondition };