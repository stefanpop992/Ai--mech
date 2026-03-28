from google import genai
from google.genai import types

from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = """Du är en expert AI-mekaniker som hjälper bilägare med felsökning, underhåll och reparationer.

REGLER:
1. Du svarar BARA på frågor som rör bilar, bilmekanik, underhåll, reparationer, reservdelar, bilsäkerhet och liknande bilrelaterade ämnen.
2. Om användaren frågar om NÅGOT annat ämne (politik, matlagning, programmering, etc.), svara artigt: "Jag är specialiserad på bilfrågor och kan tyvärr bara hjälpa dig med det. Ställ gärna en fråga om din bil!"
3. Ge alltid säkerhetsvarningar om en reparation kan vara farlig.
4. Om du inte är säker, rekommendera alltid att besöka en verkstad.
5. Svara på samma språk som användaren skriver på.
6. Håll svaren tydliga och praktiska.
7. Använd den detaljerade fordonsinformationen du har för att ge specifika svar — referera till bilens exakta motor, vikt, däckdimension etc. när det är relevant.
8. Om besiktningen snart går ut eller har gått ut, påminn användaren om det.

FORMATERING:
- Använd **fetstil** för viktiga ord och varningar
- Använd numrerade listor för steg-för-steg instruktioner
- Använd ### för rubriker om svaret är långt
- Håll svaren koncisa — max 300 ord om det inte krävs mer"""


def _build_car_context(
    car_make: str | None,
    car_model: str | None,
    car_year: int | None,
    car_engine: str | None,
    car_variant: str | None = None,
    car_color: str | None = None,
    car_fuel: str | None = None,
    car_transmission: str | None = None,
    car_power_hp: int | None = None,
    car_kerb_weight: int | None = None,
    car_meter: int | None = None,
    car_inspection: str | None = None,
    car_inspection_valid_until: str | None = None,
    car_tyre_front: str | None = None,
    car_tyre_rear: str | None = None,
    car_manufactured_country: str | None = None,
) -> str:
    """Build a rich car context string for the AI."""
    lines = [f"Bil: {car_make or 'Okänt'} {car_model or ''} {car_year or ''}"]

    if car_variant:
        lines.append(f"Variant: {car_variant}")
    if car_engine:
        lines.append(f"Motor: {car_engine}")
    if car_fuel:
        lines.append(f"Bränsle: {car_fuel}")
    if car_transmission:
        lines.append(f"Växellåda: {car_transmission}")
    if car_power_hp:
        lines.append(f"Effekt: {car_power_hp} hk")
    if car_kerb_weight:
        lines.append(f"Tjänstevikt: {car_kerb_weight} kg")
    if car_meter:
        lines.append(f"Mätarställning: {car_meter} km")
    if car_tyre_front:
        lines.append(f"Däck fram: {car_tyre_front}")
    if car_tyre_rear and car_tyre_rear != car_tyre_front:
        lines.append(f"Däck bak: {car_tyre_rear}")
    if car_inspection_valid_until:
        lines.append(f"Besiktning giltig till: {car_inspection_valid_until}")
    if car_manufactured_country:
        lines.append(f"Tillverkningsland: {car_manufactured_country}")

    return "\n".join(lines)


def get_ai_response(
    car_make: str | None,
    car_model: str | None,
    car_year: int | None,
    car_engine: str | None,
    question: str,
    history: list[dict] | None = None,
    max_output_tokens: int = 1024,
    car_variant: str | None = None,
    car_color: str | None = None,
    car_fuel: str | None = None,
    car_transmission: str | None = None,
    car_power_hp: int | None = None,
    car_kerb_weight: int | None = None,
    car_meter: int | None = None,
    car_inspection: str | None = None,
    car_inspection_valid_until: str | None = None,
    car_tyre_front: str | None = None,
    car_tyre_rear: str | None = None,
    car_manufactured_country: str | None = None,
) -> str:
    contents = []

    if history:
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])],
                )
            )

    car_context = _build_car_context(
        car_make=car_make,
        car_model=car_model,
        car_year=car_year,
        car_engine=car_engine,
        car_variant=car_variant,
        car_color=car_color,
        car_fuel=car_fuel,
        car_transmission=car_transmission,
        car_power_hp=car_power_hp,
        car_kerb_weight=car_kerb_weight,
        car_meter=car_meter,
        car_inspection=car_inspection,
        car_inspection_valid_until=car_inspection_valid_until,
        car_tyre_front=car_tyre_front,
        car_tyre_rear=car_tyre_rear,
        car_manufactured_country=car_manufactured_country,
    )

    user_message = f"[{car_context}]\n\n{question}"
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_message)],
        )
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.7,
            max_output_tokens=max_output_tokens,
        ),
    )
    return response.text
