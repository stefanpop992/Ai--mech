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

FORMATERING:
- Använd **fetstil** för viktiga ord och varningar
- Använd numrerade listor för steg-för-steg instruktioner
- Använd ### för rubriker om svaret är långt
- Håll svaren koncisa — max 300 ord om det inte krävs mer"""


def get_ai_response(
    car_make: str,
    car_model: str,
    car_year: int,
    car_engine: str | None,
    question: str,
    history: list[dict] | None = None,
    max_output_tokens: int = 1024,
) -> str:
    # Bygg konversationshistorik för Gemini
    contents = []

    # Lägg till tidigare meddelanden som kontext
    if history:
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])],
                )
            )

    # Lägg till aktuell fråga med bilkontext
    engine_info = f" {car_engine}" if car_engine else ""
    user_message = (
        f"[Bil: {car_make} {car_model} {car_year}{engine_info}]\n\n{question}"
    )
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
