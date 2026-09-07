from services.climate import get_climate_data
from services.elevation import get_elevation
from scoring.land_health import calculate_land_health


latitude = 19.9975
longitude = 73.7898


def analyze_land(latitude, longitude):

    climate = get_climate_data(
        latitude,
        longitude
    )

    elevation = get_elevation(
        latitude,
        longitude
    )

    scores = calculate_land_health(
        rainfall=climate["annual_rainfall"],
        temperature=climate["average_temperature"],
        elevation=elevation
    )

    return {
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },

        "raw_data": {
            "annual_rainfall_mm": round(
                climate["annual_rainfall"], 2
            ),
            "average_temperature_c": round(
                climate["average_temperature"], 2
            ),
            "elevation_m": round(
                elevation, 2
            )
        },

        "scores": scores
    }


if __name__ == "__main__":

    result = analyze_land(
        latitude,
        longitude
    )

    print("\nGREENVEST LAND ANALYSIS")
    print("=======================")

    print("\nLOCATION")
    print(result["location"])

    print("\nRAW DATA")
    print(result["raw_data"])

    print("\nSCORES")
    print(result["scores"])