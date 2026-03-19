const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

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

export async function askAI(
  carId: number,
  question: string,
  history: { role: string; content: string }[] = [],
) {
  return apiFetch<{ answer: string; messages_remaining: number | null }>('/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ car_id: carId, question, history }),
  });
}

export async function getAIUsage() {
  return apiFetch<{ plan: string; messages_today: number | null; messages_remaining: number | null }>('/ai/usage');
}

export async function getAIHistory(carId: number) {
  return apiFetch<{ role: string; content: string; created_at: string }[]>(
    `/ai/history?car_id=${carId}`,
  );
}

// Types matching backend CarRead schema
export interface Car {
  id: number;
  regnr: string;
  make: string | null;
  model: string | null;
  variant: string | null;
  engine: string | null;
  year: number | null;
  vin: string | null;
  color: string | null;
  status: string | null;
  transmission: string | null;
  fuel: string | null;
  power_hp: number | null;
  power_kw: number | null;
  kerb_weight: number | null;
  length: number | null;
  width: number | null;
  meter: number | null;
  inspection: string | null;
  inspection_valid_until: string | null;
  manufactured: string | null;
  manufactured_country: string | null;
  registered: string | null;
  tyre_front: string | null;
  tyre_rear: string | null;
}

