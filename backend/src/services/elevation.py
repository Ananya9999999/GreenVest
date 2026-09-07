import requests


def get_elevation(latitude, longitude):
    url = "https://api.open-meteo.com/v1/elevation"

    params = {
        "latitude": latitude,
        "longitude": longitude
    }

    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()

    data = response.json()

    return data["elevation"][0]