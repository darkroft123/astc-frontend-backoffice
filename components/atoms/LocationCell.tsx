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

  const fullText = district || (!isPlaceholderName ? locationName : null);
  const parts = fullText ? fullText.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const primaryText = parts[0] || fullText || "Cargando...";
  const secondaryText = parts.length > 1 ? parts.slice(1).join(", ") : null;

  if (effectiveLat == null || effectiveLng == null) {
    if (fullText) {
      return (
        <span className="inline-flex items-start gap-1.5 text-blue dark:text-blue text-xs max-w-[170px]">
          <MapPin className="w-3.5 h-3.5 text-blue dark:text-blue shrink-0 mt-0.5" />
          <span className="flex flex-col leading-tight text-left">
            <span className="font-medium text-foreground dark:text-white/90">{primaryText}</span>
            {secondaryText && (
              <span className="text-[11px] text-muted-foreground">{secondaryText}</span>
            )}
          </span>
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
      className="inline-flex items-start gap-1.5 text-blue dark:text-blue hover:underline text-xs max-w-[170px]"
      title={`Coordenadas: ${effectiveLat}, ${effectiveLng} (Ver en Google Maps)`}
    >
      <MapPin className="w-3.5 h-3.5 text-blue dark:text-blue shrink-0 mt-0.5" />
      <span className="flex flex-col leading-tight text-left">
        <span className="font-medium text-foreground dark:text-white/90">{primaryText}</span>
        {secondaryText && (
          <span className="text-[11px] text-muted-foreground font-normal">{secondaryText}</span>
        )}
      </span>
    </a>
  );
}
