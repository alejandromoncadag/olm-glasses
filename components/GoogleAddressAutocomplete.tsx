"use client";

import { useEffect, useRef, useState } from "react";

type AddressParts = {
  addressLine1: string;
  street?: string;
  exteriorNumber?: string;
  neighborhood?: string;
  city: string;
  state: string;
  postalCode: string;
};

type Props = {
  onSelect: (parts: AddressParts) => void;
};

type GoogleComponent = { longText?: string; shortText?: string; types?: string[] };
type GooglePlace = { formattedAddress?: string; addressComponents?: GoogleComponent[]; fetchFields: (options: { fields: string[] }) => Promise<void> };
type PlacePrediction = { text?: { toString?: () => string }; toPlace: () => GooglePlace };
type AutocompleteSuggestion = { placePrediction?: PlacePrediction };
type GoogleApi = {
  maps?: {
    places?: {
      AutocompleteSuggestion?: { fetchAutocompleteSuggestions: (request: { input: string; includedRegionCodes?: string[]; includedPrimaryTypes?: string[] }) => Promise<{ suggestions: AutocompleteSuggestion[] }> };
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
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !inputRef.current) return;

    const attach = () => setReady(Boolean(window.google?.maps?.places?.AutocompleteSuggestion));

    const existing = document.getElementById(scriptId);
    if (existing) {
      attach();
      existing.addEventListener("load", attach);
      return () => existing.removeEventListener("load", attach);
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.onload = attach;
    document.head.appendChild(script);
  }, []);

  async function search(input: string) {
    setValue(input);
    setActiveIndex(-1);
    if (!input.trim() || !ready) { setSuggestions([]); return; }
    const api = window.google?.maps?.places?.AutocompleteSuggestion;
    if (!api) return;
    try {
      const result = await api.fetchAutocompleteSuggestions({ input, includedRegionCodes: ["mx"], includedPrimaryTypes: ["street_address"] });
      setSuggestions(result.suggestions || []);
    } catch { setSuggestions([]); }
  }

  async function selectSuggestion(suggestion: AutocompleteSuggestion) {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;
    const place = prediction.toPlace();
    await place.fetchFields({ fields: ["addressComponents", "formattedAddress"] });
    const components = place.addressComponents || [];
    const find = (type: string) => components.find((item) => item.types?.includes(type))?.longText || "";
    const formatted = place.formattedAddress || prediction.text?.toString?.() || "";
    setValue(formatted); setSuggestions([]); setActiveIndex(-1);
    onSelect({ addressLine1: formatted, street: find("route"), exteriorNumber: find("street_number"), neighborhood: find("neighborhood") || find("sublocality_level_1"), city: find("locality") || find("sublocality") || find("administrative_area_level_2"), state: find("administrative_area_level_1"), postalCode: find("postal_code") });
  }

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
    if (event.key === "Enter" && activeIndex >= 0) { event.preventDefault(); void selectSuggestion(suggestions[activeIndex]); }
    if (event.key === "Escape") setSuggestions([]);
  }

  return (
    <div className="relative mt-2">
      <input ref={inputRef} type="text" value={value} onChange={(event) => void search(event.target.value)} onKeyDown={keyDown} placeholder="Empieza a escribir tu dirección" autoComplete="street-address" className="w-full border border-[#4a2d23]/40 bg-white px-4 py-3 outline-none focus:border-[#4a2d23]" aria-label="Buscar dirección con Google Maps" aria-autocomplete="list" aria-controls="olm-address-suggestions" aria-activedescendant={activeIndex >= 0 ? `olm-address-option-${activeIndex}` : undefined} />
      {suggestions.length > 0 && <ul id="olm-address-suggestions" role="listbox" className="absolute z-20 mt-1 max-h-60 w-full overflow-auto border border-[#d9cfc8] bg-white shadow-lg">{suggestions.map((suggestion, index) => <li key={`${suggestion.placePrediction?.text?.toString?.() || "address"}-${index}`} id={`olm-address-option-${index}`} role="option" aria-selected={index === activeIndex}><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => void selectSuggestion(suggestion)} className={`w-full px-4 py-3 text-left text-sm ${index === activeIndex ? "bg-[#f7f3ee]" : "hover:bg-[#faf8f5]"}`}>{suggestion.placePrediction?.text?.toString?.() || "Dirección"}</button></li>)}</ul>}
    </div>
  );
}
