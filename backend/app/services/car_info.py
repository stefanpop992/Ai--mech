import os

import httpx
from fastapi import HTTPException

BILUPPGIFTER_API_KEY = os.environ.get("BILUPPGIFTER_API_KEY", "")
BILUPPGIFTER_BASE_URL = "https://data.biluppgifter.se/api/v1"


def normalize_regnr(regnr: str) -> str:
    return regnr.replace(" ", "").upper()


def lookup_car_by_regnr(regnr: str) -> dict:
    """
    Lookup vehicle data from Biluppgifter API.
    Docs: https://data.biluppgifter.se
    """
    r = normalize_regnr(regnr)

    if not BILUPPGIFTER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="BILUPPGIFTER_API_KEY is not configured",
        )

    response = httpx.get(
        f"{BILUPPGIFTER_BASE_URL}/vehicle/regno/{r}",
        headers={
            "Authorization": f"Bearer {BILUPPGIFTER_API_KEY}",
            "Accept": "application/json",
            "User-Agent": "Ai-mech/1.0",
        },
        timeout=10,
    )

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Fordonet hittades inte")
    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Biluppgifter API error: {response.status_code}",
        )

    data = response.json()
    v = data.get("vehicle", {})
    tech = v.get("technical", {})
    drive = tech.get("drive", [{}])[0] if tech.get("drive") else {}

    return {
        "make": v.get("make"),
        "model": v.get("model"),
        "variant": v.get("variant"),
        "year": v.get("model_year"),
        "engine": v.get("variant"),
        "vin": v.get("vin"),
        "color": v.get("color"),
        "status": v.get("status"),
        "transmission": v.get("transmission"),
        "inspection": v.get("inspection"),
        "inspection_valid_until": v.get("inspection_valid_until"),
        "meter": v.get("meter"),
        "manufactured": v.get("manufactured"),
        "manufactured_country": v.get("manufactured_country"),
        "registered": v.get("registered"),
        "fuel": drive.get("fuel"),
        "power_hp": drive.get("power_hp"),
        "power_kw": drive.get("power"),
        "kerb_weight": tech.get("kerb_weight"),
        "length": tech.get("length"),
        "width": tech.get("width"),
        "number_of_passengers": tech.get("number_of_passengers"),
        "tyre_front": v.get("tyre_dimension_front"),
        "tyre_rear": v.get("tyre_dimension_rear"),
        "raw_data": v,
    }
