import React from 'react';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarBrandLogoProps {
  brand: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallbackIcon?: boolean;
}

// Map brand names to logo URLs (using free car logo CDN)
const brandLogos: Record<string, string> = {
  // German brands
  'volkswagen': 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
  'vw': 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
  'audi': 'https://www.carlogos.org/car-logos/audi-logo.png',
  'bmw': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/600px-BMW.svg.png',
  'mercedes': 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
  'mercedes-benz': 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
  'porsche': 'https://www.carlogos.org/car-logos/porsche-logo.png',
  'opel': 'https://www.carlogos.org/car-logos/opel-logo.png',

  // French brands
  'peugeot': 'https://www.carlogos.org/car-logos/peugeot-logo.png',
  'renault': 'https://www.carlogos.org/car-logos/renault-logo.png',
  'citroen': 'https://www.carlogos.org/car-logos/citroen-logo.png',
  'citroën': 'https://www.carlogos.org/car-logos/citroen-logo.png',
  'ds': 'https://www.carlogos.org/car-logos/ds-logo.png',

  // Italian brands
  'fiat': 'https://www.carlogos.org/car-logos/fiat-logo.png',
  'alfa romeo': 'https://www.carlogos.org/car-logos/alfa-romeo-logo.png',
  'ferrari': 'https://www.carlogos.org/car-logos/ferrari-logo.png',
  'lamborghini': 'https://www.carlogos.org/car-logos/lamborghini-logo.png',
  'maserati': 'https://www.carlogos.org/car-logos/maserati-logo.png',

  // Japanese brands
  'toyota': 'https://www.carlogos.org/car-logos/toyota-logo.png',
  'honda': 'https://www.carlogos.org/car-logos/honda-logo.png',
  'nissan': 'https://www.carlogos.org/car-logos/nissan-logo.png',
  'mazda': 'https://www.carlogos.org/car-logos/mazda-logo.png',
  'subaru': 'https://www.carlogos.org/car-logos/subaru-logo.png',
  'mitsubishi': 'https://www.carlogos.org/car-logos/mitsubishi-logo.png',
  'suzuki': 'https://www.carlogos.org/car-logos/suzuki-logo.png',
  'lexus': 'https://www.carlogos.org/car-logos/lexus-logo.png',

  // Korean brands
  'hyundai': 'https://www.carlogos.org/car-logos/hyundai-logo.png',
  'kia': 'https://www.carlogos.org/car-logos/kia-logo.png',

  // American brands
  'ford': 'https://www.carlogos.org/car-logos/ford-logo.png',
  'chevrolet': 'https://www.carlogos.org/car-logos/chevrolet-logo.png',
  'jeep': 'https://www.carlogos.org/car-logos/jeep-logo.png',
  'tesla': 'https://www.carlogos.org/car-logos/tesla-logo.png',
  'dodge': 'https://www.carlogos.org/car-logos/dodge-logo.png',

  // British brands
  'land rover': 'https://www.carlogos.org/car-logos/land-rover-logo.png',
  'jaguar': 'https://www.carlogos.org/car-logos/jaguar-logo.png',
  'mini': 'https://www.carlogos.org/car-logos/mini-logo.png',
  'bentley': 'https://www.carlogos.org/car-logos/bentley-logo.png',
  'rolls-royce': 'https://www.carlogos.org/car-logos/rolls-royce-logo.png',
  'aston martin': 'https://www.carlogos.org/car-logos/aston-martin-logo.png',

  // Swedish brands
  'volvo': 'https://www.carlogos.org/car-logos/volvo-logo.png',

  // Czech brands
  'skoda': 'https://www.carlogos.org/car-logos/skoda-logo.png',
  'škoda': 'https://www.carlogos.org/car-logos/skoda-logo.png',

  // Spanish brands
  'seat': 'https://www.carlogos.org/car-logos/seat-logo.png',
  'cupra': 'https://www.carlogos.org/car-logos/cupra-logo.png',

  // Romanian brands
  'dacia': 'https://www.carlogos.org/car-logos/dacia-logo.png',
};

function getBrandLogoUrl(brand: string): string | null {
  if (!brand) return null;
  const normalizedBrand = brand.toLowerCase().trim();
  return brandLogos[normalizedBrand] || null;
}

export function CarBrandLogo({ brand, size = 'md', className, showFallbackIcon = true }: CarBrandLogoProps) {
  const logoUrl = getBrandLogoUrl(brand);

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
    xl: 'h-9 w-9',
  };

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${brand} logo`}
        className={cn(
          sizeClasses[size],
          'object-contain',
          className
        )}
        onError={(e) => {
          // Hide broken image and show nothing or fallback
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  if (showFallbackIcon) {
    return <Car className={cn(iconSizes[size], 'text-white', className)} />;
  }

  return null;
}

// Export for direct use of logo URLs
export { getBrandLogoUrl, brandLogos };
