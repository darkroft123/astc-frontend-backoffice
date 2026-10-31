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
  const isPlaceholderName =
    !locationName ||
    locationName === "Ubicación registrada" ||
    locationName === "Cargando...";

  const [district, setDistrict] = useState<string | null>(
    !isPlaceholderName ? locationName : null
  );
  const effectiveLat = lat ?? latitude;
  const effectiveLng = lng ?? longitude;

  useEffect(() => {
    if (locationName && !isPlaceholderName) {
      setDistrict(locationName);
      return;
    }
    if (effectiveLat != null && effectiveLng != null) {
      getDistrictFromCoords(effectiveLat, effectiveLng).then(setDistrict);
    }
  }, [effectiveLat, effectiveLng, locationName, isPlaceholderName]);

  if (effectiveLat == null || effectiveLng == null) {
    if (locationName && !isPlaceholderName) {
      return (
        <span className="inline-flex items-center gap-1.5 text-blue dark:text-blue text-xs">
          <MapPin className="w-3.5 h-3.5 text-blue dark:text-blue shrink-0" />
          <span className="whitespace-nowrap">{locationName}</span>
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
      <span className="whitespace-nowrap">{district || "Cargando..."}</span>
    </a>
  );
}
