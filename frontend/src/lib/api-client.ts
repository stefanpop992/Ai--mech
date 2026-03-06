const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// All requests use credentials: 'include' so the browser sends the auth cookie automatically
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!res.ok) {
    const error: any = new Error('API request failed');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// Generic fetcher for SWR
export async function fetcher<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}

export async function getCars() {
  return apiFetch<Car[]>('/cars');
}

export async function addCarByRegnr(regnr: string) {
  return apiFetch<Car>('/cars/register', {
    method: 'POST',
    body: JSON.stringify({ regnr }),
  });
}

export async function addCarManual(data: { regnr: string; make: string; model: string; year: number; engine?: string }) {
  return apiFetch<Car>('/cars', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteCar(carId: number) {
  const res = await fetch(`${API_BASE_URL}/cars/${carId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Kunde inte ta bort bil');
}

export async function askAI(carId: number, question: string) {
  return apiFetch<{ answer: string }>('/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ car_id: carId, question }),
  });
}

// Types matching backend CarRead schema
export interface Car {
  id: number;
  regnr: string;
  make: string | null;
  model: string | null;
  engine: string | null;
  year: number | null;
}
