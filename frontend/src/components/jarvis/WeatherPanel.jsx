import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, RefreshCw, MapPin, Thermometer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

export const WeatherPanel = () => {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [city, setCity] = useState('London');
  const [searchCity, setSearchCity] = useState('');
  const [units, setUnits] = useState('metric');

  useEffect(() => {
    loadWeather();
  }, [city, units]);

  const loadWeather = async () => {
    setIsLoading(true);
    try {
      const data = await api.getWeather(city, units);
      setWeather(data);
    } catch (err) {
      toast.error('Failed to load weather data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchCity.trim()) {
      setCity(searchCity.trim());
      setSearchCity('');
    }
  };

  const getWeatherIcon = (code, size = 24) => {
    if (code === 0 || code === 1) return <Sun size={size} className="text-alert-amber" />;
    if (code >= 2 && code <= 3) return <Cloud size={size} className="text-muted-foreground" />;
    if (code >= 45 && code <= 48) return <Cloud size={size} className="text-muted-foreground" />;
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain size={size} className="text-neon-blue" />;
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow size={size} className="text-white" />;
    if (code >= 95) return <CloudLightning size={size} className="text-alert-amber" />;
    return <Cloud size={size} className="text-muted-foreground" />;
  };

  const weatherDescriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Light showers",
    81: "Showers",
    82: "Heavy showers",
    85: "Light snow showers",
    86: "Snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm + hail",
    99: "Severe storm"
  };

  return (
    <div className="glass-panel hud-border p-6" data-testid="weather-panel">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-orbitron text-sm tracking-widest text-neon-blue">
          WEATHER REPORT
        </h3>
        <Button
          onClick={loadWeather}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-neon-blue"
          data-testid="refresh-weather-btn"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          placeholder="Search city..."
          className="bg-black/50 border-neon-blue/30 font-barlow text-sm"
          data-testid="weather-city-input"
        />
        <Button
          type="submit"
          className="bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 font-mono text-xs"
        >
          <MapPin size={14} />
        </Button>
      </form>

      {/* Units Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setUnits('metric')}
          className={`px-3 py-1 text-xs font-mono transition-colors ${
            units === 'metric' 
              ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/50' 
              : 'text-muted-foreground border border-transparent hover:text-foreground'
          }`}
        >
          °C
        </button>
        <button
          onClick={() => setUnits('imperial')}
          className={`px-3 py-1 text-xs font-mono transition-colors ${
            units === 'imperial' 
              ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/50' 
              : 'text-muted-foreground border border-transparent hover:text-foreground'
          }`}
        >
          °F
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="flex justify-center gap-1">
            <span className="w-2 h-2 bg-neon-blue rounded-full typing-dot" />
            <span className="w-2 h-2 bg-neon-blue rounded-full typing-dot" />
            <span className="w-2 h-2 bg-neon-blue rounded-full typing-dot" />
          </div>
          <p className="text-muted-foreground font-mono text-xs mt-4">FETCHING DATA...</p>
        </div>
      ) : weather ? (
        <div className="space-y-6">
          {/* Current Weather */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MapPin size={14} className="text-neon-blue" />
              <span className="font-rajdhani text-lg">
                {weather.city}, {weather.country}
              </span>
            </div>
            
            <div className="flex items-center justify-center gap-4 my-4">
              {getWeatherIcon(weather.weather_code, 48)}
              <span className="text-5xl font-orbitron font-bold text-foreground">
                {Math.round(weather.temperature)}{weather.temp_unit}
              </span>
            </div>
            
            <p className="text-muted-foreground font-barlow capitalize mb-4">
              {weather.description}
            </p>
            
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Droplets size={14} className="text-neon-blue" />
                <span>{weather.humidity}%</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wind size={14} className="text-neon-blue" />
                <span>{weather.wind_speed} {weather.wind_unit}</span>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          {weather.forecast && weather.forecast.dates && (
            <div className="border-t border-neon-blue/10 pt-4">
              <h4 className="text-xs font-mono text-muted-foreground tracking-wider mb-3">
                5-DAY FORECAST
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {weather.forecast.dates.map((date, index) => (
                  <div key={index} className="text-center p-2 bg-black/30">
                    <p className="text-[10px] font-mono text-muted-foreground mb-1">
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    {getWeatherIcon(weather.forecast.codes[index], 16)}
                    <div className="text-xs font-mono mt-1">
                      <span className="text-foreground">{Math.round(weather.forecast.max_temps[index])}°</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-muted-foreground">{Math.round(weather.forecast.min_temps[index])}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Cloud size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-xs font-mono">NO DATA AVAILABLE</p>
        </div>
      )}
    </div>
  );
};

export default WeatherPanel;
