#!/usr/bin/env python3
"""
Weather Engine - 天气获取引擎

集成到 HeartFlow v9.1.2
数据源: Open-Meteo (免费，无需API Key)
"""

import urllib.request
import json
import sys

# 城市坐标库
CITIES = {
    "dubai": {"lat": 25.2048, "lon": 55.2708, "name": "迪拜"},
    "shanghai": {"lat": 31.2304, "lon": 121.4737, "name": "上海"},
    "beijing": {"lat": 39.9042, "lon": 116.4074, "name": "北京"},
    "tokyo": {"lat": 35.6762, "lon": 139.6503, "name": "东京"},
    "london": {"lat": 51.5074, "lon": -0.1278, "name": "伦敦"},
    "newyork": {"lat": 40.7128, "lon": -74.0060, "name": "纽约"},
    "paris": {"lat": 48.8566, "lon": 2.3522, "name": "巴黎"},
    "singapore": {"lat": 1.3521, "lon": 103.8198, "name": "新加坡"},
}

DEFAULT_CITY = "dubai"


def get_weather(city: str, unit: str = "celsius") -> dict:
    """获取城市天气"""
    city_lower = city.lower()
    city_info = CITIES.get(city_lower, CITIES[DEFAULT_CITY])
    
    url = f"https://api.open-meteo.com/v1/forecast?latitude={city_info['lat']}&longitude={city_info['lon']}&current=temperature_2m&weather_code&wind_speed_10m"
    
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
        
        current = data.get("current", {})
        temp = current.get("temperature_2m", "N/A")
        weather_code = current.get("weather_code", 0)
        wind = current.get("wind_speed_10m", "N/A")
        
        weather_desc = get_weather_desc(weather_code)
        
        return {
            "city": city_info["name"],
            "temperature": temp,
            "unit": unit,
            "weather": weather_desc,
            "wind": wind,
            "success": True
        }
    except Exception as e:
        return {
            "city": city_info["name"],
            "error": str(e),
            "success": False
        }


def get_weather_desc(code: int) -> str:
    """天气代码转描述"""
    weather_codes = {
        0: "☀️ 晴朗",
        1: "🌤️ 晴间多云",
        2: "⛅ 多云",
        3: "☁️ 阴",
        45: "🌫️ 雾",
        48: "🌫️ 雾凇",
        51: "🌧️ 小雨",
        53: "🌧️ 中雨",
        55: "🌧️ 大雨",
        61: "🌧️ 小雨",
        63: "🌧️ 中雨",
        65: "🌧️ 大雨",
        71: "🌨️ 小雪",
        73: "🌨️ 中雪",
        75: "🌨️ 大雪",
        77: "🌨️ 雪粒",
        80: "🌦️ 小阵雨",
        81: "🌦️ 中阵雨",
        82: "🌦️ 大阵雨",
        85: "🌨️ 小阵雪",
        86: "🌨️ 大阵雪",
        95: "⛈️ 雷暴",
        96: "⛈️ 雷暴+冰雹",
        99: "⛈️ 强雷暴",
    }
    return weather_codes.get(code, "🌡️ 未知")


def main():
    city = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CITY
    unit = sys.argv[2] if len(sys.argv) > 2 else "celsius"
    
    result = get_weather(city, unit)
    
    if result["success"]:
        print(f"🌤️ {result['city']}当前温度: {result['temperature']}°{result['unit']}")
        print(f"   天气: {result['weather']}")
        print(f"   风速: {result['wind']} km/h")
    else:
        print(f"❌ 获取天气失败: {result.get('error', '未知错误')}")


if __name__ == "__main__":
    main()