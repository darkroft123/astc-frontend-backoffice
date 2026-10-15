"use client";
import { useEffect, useState } from "react";
import { getDistrictFromCoords } from "@/lib/geocoding";
import { MapPin } from "lucide-react";
export function LocationCell({
  lat,
  lng,
  latitude,
  longitude,
  locationName,
}: {
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
}) {
  const [district, setDistrict] = useState<string | null>(locationName || null);
  const effectiveLat = lat ?? latitude;
  const effectiveLng = lng ?? longitude;

  useEffect(() => {
    if (locationName) {
      setDistrict(locationName);
      return;
    }
    if (effectiveLat != null && effectiveLng != null) {
      getDistrictFromCoords(effectiveLat, effectiveLng).then(setDistrict);
    }
  }, [effectiveLat, effectiveLng, locationName]);

  if (effectiveLat == null || effectiveLng == null) {
    if (locationName) {
      return (
        <span className="inline-flex items-center gap-1.5 text-blue dark:text-blue text-xs">
          <MapPin className="w-3.5 h-3.5 text-blue dark:text-blue shrink-0" />
          <span className="truncate max-w-[140px]">{locationName}</span>
        </span>
      );
    }
    return <span className="text-muted-foreground">-</span>;
  }

  const mapsUrl = `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-blue dark:text-blue font-normal hover:underline text-xs"
      title={`Coordenadas: ${effectiveLat}, ${effectiveLng} (Ver en Google Maps)`}
    >
      <MapPin className="w-3.5 h-3.5 text-blue dark:text-blue shrink-0" />
      <span className="truncate max-w-[140px]">{district || locationName || "Condevilla Señor"}</span>
    </a>
  );
}
