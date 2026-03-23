'use client';

import Image from 'next/image';

// Map make names (lowercase) to logo filenames in /public/logos/
const LOGO_MAP: Record<string, string> = {
    'volkswagen': 'volkswagen.svg',
    'volvo': 'volvo.svg',
    'bmw': 'bmw.svg',
    'audi': 'audi.svg',
    'mercedes-benz': 'mercedes.svg',
    'toyota': 'toyota.svg',
    'ford': 'ford.svg',
    'kia': 'kia.svg',
    'hyundai': 'hyundai.svg',
    'skoda': 'skoda.svg',
    'peugeot': 'peugeot.svg',
    'renault': 'renault.svg',
    'tesla': 'tesla.svg',
    'mazda': 'mazda.svg',
    'nissan': 'nissan.svg',
    'honda': 'honda.svg',
    'saab': 'saab.svg',
    'opel': 'opel.svg',
    'citroën': 'citroen.svg',
    'citroen': 'citroen.svg',
    'fiat': 'fiat.svg',
    'mitsubishi': 'mitsubishi.svg',
    'subaru': 'subaru.svg',
    'seat': 'seat.svg',
    'cupra': 'cupra.svg',
    'dacia': 'dacia.svg',
    'suzuki': 'suzuki.svg',
    'jeep': 'jeep.svg',
    'mini': 'mini.svg',
    'porsche': 'porsche.svg',
    'lexus': 'lexus.svg',
};

interface CarBrandLogoProps {
    make: string | null;
    size?: number;
    className?: string;
}

export default function CarBrandLogo({ make, size = 48, className = '' }: CarBrandLogoProps) {
    const key = (make ?? '').toLowerCase().trim();
    const file = LOGO_MAP[key];

    if (!file) {
        // Fallback: first letter of make
        return (
            <div
                className={`flex items-center justify-center font-bebas ${className}`}
                style={{
                    width: size,
                    height: size,
                    background: 'var(--steel)',
                    border: '1px solid var(--border)',
                    color: 'var(--red)',
                    fontSize: size * 0.5,
                }}
            >
                {key ? key[0].toUpperCase() : '?'}
            </div>
        );
    }

    return (
        <div
            className={`flex items-center justify-center ${className}`}
            style={{
                width: size,
                height: size,
                background: 'var(--steel)',
                border: '1px solid var(--border)',
                padding: size * 0.15,
            }}
        >
            <img
                src={`/logos/${file}`}
                alt={make ?? 'Bilmärke'}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'brightness(0) invert(1)',
                }}
            />
        </div>
    );
}