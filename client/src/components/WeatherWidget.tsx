import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
  };
}

export function WeatherWidget() {
  const { data: weather, isLoading, isError } = useQuery<WeatherData>({
    queryKey: ["/api/weather-orlando"],
    queryFn: async () => {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=28.54&longitude=-81.38&current=temperature_2m,relative_humidity_2m&hourly=temperature_2m,relative_humidity_2m&temperature_unit=fahrenheit&past_hours=3'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 text-sm text-muted-foreground" data-testid="weather-loading">
        <span>Loading weather...</span>
      </div>
    );
  }

  if (isError || !weather) {
    return (
      <div className="flex items-center gap-4 text-sm text-muted-foreground" data-testid="weather-error">
        <span>Weather unavailable</span>
      </div>
    );
  }

  // Get trend by comparing current with 3 hours ago
  const currentTemp = weather.current.temperature_2m;
  const currentHumidity = weather.current.relative_humidity_2m;
  
  // Get temperature 3 hours ago (4th item from end since hourly includes current)
  const tempHistory = weather.hourly.temperature_2m.slice(-4);
  const humidityHistory = weather.hourly.relative_humidity_2m.slice(-4);
  
  const pastTemp = tempHistory[0];
  const pastHumidity = humidityHistory[0];

  const tempTrend = currentTemp > pastTemp + 1 ? "up" : currentTemp < pastTemp - 1 ? "down" : "stable";
  const humidityTrend = currentHumidity > pastHumidity + 2 ? "up" : currentHumidity < pastHumidity - 2 ? "down" : "stable";

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
    if (trend === "up") return <TrendingUp className="w-3 h-3 text-red-500" />;
    if (trend === "down") return <TrendingDown className="w-3 h-3 text-blue-500" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <div 
      className="flex items-center gap-6 text-sm" 
      data-testid="weather-widget"
    >
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Orlando, FL:</span>
      </div>
      <div className="flex items-center gap-2" data-testid="weather-temperature">
        <span className="font-medium">{Math.round(currentTemp)}°F</span>
        <TrendIcon trend={tempTrend} />
      </div>
      <div className="flex items-center gap-2" data-testid="weather-humidity">
        <span className="font-medium">{Math.round(currentHumidity)}% humidity</span>
        <TrendIcon trend={humidityTrend} />
      </div>
    </div>
  );
}
