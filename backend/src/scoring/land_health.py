def normalize(value, minimum, maximum):
    if value <= minimum:
        return 0

    if value >= maximum:
        return 100

    return ((value - minimum) / (maximum - minimum)) * 100


def calculate_land_health(rainfall, temperature, elevation):

    rainfall_score = normalize(
        rainfall,
        500,
        2000
    )

    temperature_score = 100 - abs(temperature - 25) * 5
    temperature_score = max(
        0,
        min(100, temperature_score)
    )

    elevation_score = normalize(
        elevation,
        0,
        500
    )

    overall_score = (
        rainfall_score * 0.40
        + temperature_score * 0.40
        + elevation_score * 0.20
    )

    return {
        "rainfall_score": round(rainfall_score, 2),
        "temperature_score": round(temperature_score, 2),
        "terrain_score": round(elevation_score, 2),
        "overall_score": round(overall_score, 2)
    }