from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

def get_api_key():
    return os.getenv("WEATHER_API_KEY") or os.getenv("OPENWEATHER_API_KEY") or "84cc4ee3471060b9bc63b883cef0bf38"

def home(request):
    weather = None
    error = None

    if request.method == "POST":
        city = request.POST.get("city")
        if city:
            api_key = get_api_key()
            url = "https://api.openweathermap.org/data/2.5/weather"
            params = {
                "q": city,
                "appid": api_key,
                "units": "metric"
            }
            try:
                response = requests.get(url, params=params, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    weather = {
                        "city": data.get("name"),
                        "country": data.get("sys", {}).get("country", ""),
                        "temperature": data.get("main", {}).get("temp"),
                        "feels_like": data.get("main", {}).get("feels_like"),
                        "description": data.get("weather", [{}])[0].get("description", "").title(),
                        "humidity": data.get("main", {}).get("humidity"),
                        "wind": data.get("wind", {}).get("speed"),
                        "icon": data.get("weather", [{}])[0].get("icon", "01d")
                    }
                else:
                    error = "City not found!"
            except Exception as e:
                error = "Unable to fetch weather data. Please try again later."

    return render(request, "weather/index.html", {
        "weather": weather,
        "error": error
    })

@csrf_exempt
def weather_api(request):
    """
    REST API endpoint for Weather data.
    Accepts GET /api/weather/?city=London
    or POST with JSON body {"city": "London"} / form-data.
    """
    city = None
    if request.method == "GET":
        city = request.GET.get("city")
    elif request.method == "POST":
        if request.content_type == "application/json":
            try:
                body = json.loads(request.body)
                city = body.get("city")
            except json.JSONDecodeError:
                pass
        if not city:
            city = request.POST.get("city")

    if not city:
        return JsonResponse({
            "success": False,
            "error": "City parameter is required."
        }, status=400)

    api_key = get_api_key()
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": api_key,
        "units": "metric"
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return JsonResponse({
                "success": True,
                "city": data.get("name"),
                "country": data.get("sys", {}).get("country", ""),
                "temperature": round(data.get("main", {}).get("temp", 0), 1),
                "feels_like": round(data.get("main", {}).get("feels_like", 0), 1),
                "temp_min": round(data.get("main", {}).get("temp_min", 0), 1),
                "temp_max": round(data.get("main", {}).get("temp_max", 0), 1),
                "description": data.get("weather", [{}])[0].get("description", "").title(),
                "humidity": data.get("main", {}).get("humidity"),
                "pressure": data.get("main", {}).get("pressure"),
                "wind": data.get("wind", {}).get("speed"),
                "icon": data.get("weather", [{}])[0].get("icon", "01d"),
                "main_condition": data.get("weather", [{}])[0].get("main", "Clear")
            })
        else:
            return JsonResponse({
                "success": False,
                "error": "City not found! Please check spelling."
            }, status=404)
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": f"API request error: {str(e)}"
        }, status=500)