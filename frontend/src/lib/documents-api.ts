const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface CarDocument {
    id: number;
    car_id: number;
    category: string;
    filename: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
}

export async function listDocuments(carId: number, category?: string): Promise<CarDocument[]> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${API_BASE_URL}/cars/${carId}/documents${qs}`, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Kunde inte hämta dokument');
    return res.json();
}

export async function uploadDocument(
    carId: number,
    category: string,
    file: File,
): Promise<CarDocument> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(
        `${API_BASE_URL}/cars/${carId}/documents?category=${encodeURIComponent(category)}`,
        {
            method: 'POST',
            credentials: 'include',
            body: formData,
        },
    );
    if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ?? 'Kunde inte ladda upp dokumentet');
    }
    return res.json();
}

export function getDocumentDownloadUrl(carId: number, docId: number): string {
    return `${API_BASE_URL}/cars/${carId}/documents/${docId}/download`;
}

export async function deleteDocument(carId: number, docId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/cars/${carId}/documents/${docId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Kunde inte ta bort dokumentet');
}