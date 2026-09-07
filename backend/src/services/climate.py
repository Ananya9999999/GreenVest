import requests


def get_climate_data(latitude, longitude):
    url = "https://archive-api.open-meteo.com/v1/archive"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "daily": [
            "temperature_2m_mean",
            "precipitation_sum"
        ],
        "timezone": "auto"
    }

    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()

    data = response.json()

    temperatures = [
        x for x in data["daily"]["temperature_2m_mean"]
        if x is not None
    ]

    rainfall = [
        x for x in data["daily"]["precipitation_sum"]
        if x is not None
    ]

    return {
        "average_temperature": sum(temperatures) / len(temperatures),
        "annual_rainfall": sum(rainfall)
    }