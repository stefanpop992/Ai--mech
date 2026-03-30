const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ServiceLogItem {
    id?: number;
    category: string;
    label: string;
    checked: boolean;
}

export interface ServiceLogImage {
    id: number;
    filename: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
}

export interface ServiceLogSummary {
    id: number;
    car_id: number;
    service_date: string;
    mileage: number | null;
    workshop: string | null;
    cost: number | null;
    item_count: number;
    image_count: number;
    categories: string[];
    created_at: string;
}

export interface ServiceLog {
    id: number;
    car_id: number;
    service_date: string;
    mileage: number | null;
    workshop: string | null;
    cost: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    items: ServiceLogItem[];
    images: ServiceLogImage[];
}

export interface ServiceLogCreatePayload {
    service_date: string;
    mileage?: number | null;
    workshop?: string | null;
    cost?: number | null;
    notes?: string | null;
    items: { category: string; label: string; checked: boolean }[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function listServiceLogs(carId: number): Promise<ServiceLogSummary[]> {
    const res = await fetch(`${API_BASE_URL}/cars/${carId}/services`, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Kunde inte hämta serviceloggar');
    return res.json();
}

export async function getServiceLog(carId: number, serviceId: number): Promise<ServiceLog> {
    const res = await fetch(`${API_BASE_URL}/cars/${carId}/services/${serviceId}`, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Kunde inte hämta service');
    return res.json();
}

export async function createServiceLog(
    carId: number,
    payload: ServiceLogCreatePayload,
): Promise<ServiceLog> {
    const res = await fetch(`${API_BASE_URL}/cars/${carId}/services`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Kunde inte skapa service');
    }
    return res.json();
}

export async function updateServiceLog(
    carId: number,
    serviceId: number,
    payload: Partial<ServiceLogCreatePayload>,
): Promise<ServiceLog> {
    const res = await fetch(`${API_BASE_URL}/cars/${carId}/services/${serviceId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Kunde inte uppdatera service');
    return res.json();
}

export async function deleteServiceLog(carId: number, serviceId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/cars/${carId}/services/${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Kunde inte ta bort service');
}

export async function uploadServiceImage(
    carId: number,
    serviceId: number,
    file: File,
): Promise<ServiceLogImage> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(
        `${API_BASE_URL}/cars/${carId}/services/${serviceId}/images`,
        { method: 'POST', credentials: 'include', body: formData },
    );
    if (!res.ok) throw new Error('Kunde inte ladda upp bild');
    return res.json();
}

export async function deleteServiceImage(
    carId: number,
    serviceId: number,
    imageId: number,
): Promise<void> {
    const res = await fetch(
        `${API_BASE_URL}/cars/${carId}/services/${serviceId}/images/${imageId}`,
        { method: 'DELETE', credentials: 'include' },
    );
    if (!res.ok) throw new Error('Kunde inte ta bort bild');
}

export function getServiceImagePreviewUrl(
    carId: number,
    serviceId: number,
    imageId: number,
): string {
    return `${API_BASE_URL}/cars/${carId}/services/${serviceId}/images/${imageId}/preview`;
}