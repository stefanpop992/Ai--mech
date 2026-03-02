
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';


export async function getCars() {
  const res = await fetch(`${API_BASE_URL}/cars`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Kunde inte hämta bilar från servern');
  }
  return res.json();
}


export async function askAI(carId: number, question: string) {
  const res = await fetch(`${API_BASE_URL}/ai/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ car_id: carId, question }),
  });
  
  if (!res.ok) {
    throw new Error('AI-mekanikern svarar inte');
  }
  return res.json();
}