from django.shortcuts import render
import requests
import os
from dotenv import load_dotenv

load_dotenv()


def home(request):

    weather = None
    error = None

    if request.method == "POST":

        city = request.POST.get("city")

        api_key = os.getenv("84cc4ee3471060b9bc63b883cef0bf38")

        url = "https://api.openweathermap.org/data/2.5/weather"

        params = {
            "q": city,
            "appid": api_key,
            "units": "metric"
        }

        response = requests.get(url, params=params)

        if response.status_code == 200:

            data = response.json()

            weather = {
                "city": data["name"],
                "temperature": data["main"]["temp"],
                "description": data["weather"][0]["description"],
                "humidity": data["main"]["humidity"],
                "wind": data["wind"]["speed"]
            }

        else:
            error = "City not found!"

    return render(request, "weather/index.html", {
        "weather": weather,
        "error": error
    })