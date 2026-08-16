"use client";

import { useEffect, useRef } from "react";

type AddressParts = {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
};

type Props = {
  onSelect: (parts: AddressParts) => void;
};

type GoogleComponent = { long_name: string; types: string[] };
type GooglePlace = { formatted_address?: string; address_components?: GoogleComponent[] };
type GoogleAutocomplete = {
  getPlace: () => GooglePlace;
  addListener: (event: string, callback: () => void) => void;
};
type GoogleApi = {
  maps?: {
    places?: {
      Autocomplete: new (input: HTMLInputElement, options: Record<string, unknown>) => GoogleAutocomplete;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleApi;
  }
}

const scriptId = "olm-google-places-script";

export default function GoogleAddressAutocomplete({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !inputRef.current) return;

    const attach = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: ["mx"] },
        fields: ["address_components", "formatted_address"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const components = place.address_components || [];
        const find = (type: string) => components.find((item) => item.types?.includes(type))?.long_name || "";
        onSelect({
          addressLine1: place.formatted_address || "",
          city: find("locality") || find("sublocality") || find("administrative_area_level_2"),
          state: find("administrative_area_level_1"),
          postalCode: find("postal_code"),
        });
      });
    };

    const existing = document.getElementById(scriptId);
    if (existing) {
      attach();
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.onload = attach;
    document.head.appendChild(script);
  }, [onSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Empieza a escribir tu dirección"
      autoComplete="street-address"
      className="mt-2 w-full border border-[#4a2d23]/40 bg-white px-4 py-3 outline-none focus:border-[#4a2d23]"
      aria-label="Buscar dirección con Google Maps"
    />
  );
}
