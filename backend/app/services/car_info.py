def normalize_regnr(regnr: str) -> str:
    return regnr.replace(" ", "").upper()


def lookup_car_by_regnr(regnr: str) -> dict:
    """
    MVP. Byt senare till riktigt svenskt API.
    """
    r = normalize_regnr(regnr)

    # Exempel: om ni vill testa med er VW Bora direkt
    if r in {"ABC123", "BORA19"}:
        return {
            "make": "Volkswagen",
            "model": "Bora",
            "engine": "1.9 TDI (AHF)",
            "year": 1999,
        }

    # default dummy
    return {"make": "Volvo", "model": "V70", "engine": "2.4", "year": 2004}
