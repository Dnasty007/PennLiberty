import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SaleListing } from "@/lib/data";

type Props = {
  filteredListings: SaleListing[];
  selectedListingId: number;
  lightMode: boolean;
  onSelectListing: (id: number) => void;
};

function priceLabel(price: string) {
  return price.replace(",000", "k");
}

/** Imperative Philly listing map — OSM-derived tiles via CARTO (attribution in control). */
export function ListingExplorerLeaflet({
  filteredListings,
  selectedListingId,
  lightMode,
  onSelectListing,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const selectRef = useRef(onSelectListing);
  selectRef.current = onSelectListing;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;

    const map = L.map(el, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    });

    mapRef.current = map;
    const layerGroup = L.layerGroup().addTo(map);
    layerRef.current = layerGroup;

    const tileDark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 20,
    });
    const tileLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 20,
    });

    (lightMode ? tileLight : tileDark).addTo(map);
    map.setView([39.9526, -75.1652], 12);

    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tile theme keyed to light vs dark toggle only
  }, [lightMode]);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    for (const listing of filteredListings) {
      const isSel = listing.id === selectedListingId;

      const icon = L.divIcon({
        className: "listing-explorer-marker",
        html: `<div class="listing-explorer-marker__pill ${
          isSel ? "listing-explorer-marker__pill--selected" : ""
        }">${priceLabel(listing.price)}</div>`,
        iconSize: [160, 48],
        iconAnchor: [80, 48],
      });

      const marker = L.marker([listing.lat, listing.lng], { icon }).on("click", () => {
        selectRef.current(listing.id);
      });
      marker.addTo(layerGroup);
    }

    if (filteredListings.length === 0) {
      map.setView([39.9526, -75.1652], 12);
    } else {
      const bounds = L.latLngBounds(filteredListings.map((l) => [l.lat, l.lng] as L.LatLngTuple));
      map.fitBounds(bounds.pad(0.12), { maxZoom: 14 });
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [filteredListings, selectedListingId]);

  return (
    <>
      <style>{`
        .listing-explorer-marker { background: none; border: none; }
        .listing-explorer-marker__pill {
          position: relative; left: -50%; top: -100%;
          min-width: 56px; padding: 10px 12px;
          border-radius: 9999px; border: 1.5px solid rgba(255,255,255,0.28);
          background: rgba(0,0,0,0.55); backdrop-filter: blur(12px);
          font: 600 13px/1 system-ui, sans-serif; color: white;
          white-space: nowrap; box-shadow: 0 12px 28px rgba(0,0,0,0.35); cursor: pointer;
        }
        .listing-explorer-marker__pill--selected {
          border-color: rgba(255,248,232,1); background: #d6b06a;
          color: #08111f; transform: scale(1.05);
          box-shadow: 0 14px 36px rgba(214,176,106,0.45);
        }
      `}</style>
      <div
        ref={wrapRef}
        className="listing-leaflet-host z-0 h-full min-h-[400px] w-full rounded-[inherit] md:min-h-[520px]"
      />
    </>
  );
}

export default ListingExplorerLeaflet;
