const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PartStatus = 'installed' | 'spare' | 'ordered';

export interface Part {
    id: number;
    car_id: number;
    name: string;
    category: string;
    brand: string | null;
    part_number: string | null;
    quantity: number;
    vendor: string | null;
    cost: number | null;
    purchased_date: string | null;
    installed_date: string | null;
    mileage: number | null;
    status: PartStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface PartPayload {
    name: string;
    category: string;
    brand?: string | null;
    part_number?: string | null;
    quantity: number;
    vendor?: string | null;
    cost?: number | null;
    purchased_date?: string | null;
    installed_date?: string | null;
    mileage?: number | null;
    status: PartStatus;
    notes?: string | null;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function listParts(carId: number): Promise<Part[]> {
    const res = await fetch(`${API_BASE_URL}/cars/${carId}/parts`, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Kunde inte hämta delar');
    return res.json();
}

export async function createPart(carId: number, payload: PartPayload): Promise<Part> {
    const res = await fetch(`${API_BASE_URL}/cars/${carId}/parts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Kunde inte spara delen');
    }
    return res.json();
}

export async function updatePart(
    carId: number,
    partId: number,
    payload: Partial<PartPayload>,
): Promise<Part> {
    const res = await fetch(`${API_BASE_URL}/cars/${carId}/parts/${partId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Kunde inte uppdatera delen');
    }
    return res.json();
}

export async function deletePart(carId: number, partId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/cars/${carId}/parts/${partId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Kunde inte ta bort delen');
}
