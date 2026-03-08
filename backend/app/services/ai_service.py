from google import genai
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

def get_ai_response(car_make: str, car_model: str, question: str) -> str:
    prompt = f"""Du är en expert AI-mekaniker. 
Användaren har en {car_make} {car_model}.
Svara på samma språk som användaren skriver på.

Formatera alltid ditt svar med markdown:
- Använd **fetstil** för viktiga ord
- Använd numrerade listor för steg-för-steg instruktioner
- Använd ### för rubriker om svaret är långt
- Håll svaren koncisa och tydliga

Fråga: {question}"""

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt
    )
    return response.text