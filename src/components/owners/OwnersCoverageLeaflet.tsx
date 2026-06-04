import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  lightMode: boolean;
};

const NEIGHBORHOODS = [
  { name: "Temple / North Philly", lat: 39.9816, lng: -75.1552 },
  { name: "Northern Liberties", lat: 39.9631, lng: -75.1355 },
  { name: "Fishtown", lat: 39.9700, lng: -75.1200 },
  { name: "South Philly", lat: 39.9220, lng: -75.1630 },
  { name: "Center City", lat: 39.9526, lng: -75.1652 },
  { name: "Fairmount / Art Museum", lat: 39.9690, lng: -75.1765 },
];

/** Interactive Leaflet map showing Penn Liberty's covered Philadelphia neighborhoods. */
export function OwnersCoverageLeaflet({ lightMode }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;

    const map = L.map(el, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    mapRef.current = map;

    const tileDark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 20,
    });
    const tileLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 20,
    });

    (lightMode ? tileLight : tileDark).addTo(map);
    map.setView([39.955, -75.155], 12);

    for (const hood of NEIGHBORHOODS) {
      L.circleMarker([hood.lat, hood.lng], {
        radius: 10,
        fillColor: "#d6b06a",
        color: "#f4dfb4",
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.75,
      })
        .addTo(map)
        .bindPopup(`<strong style="font-size:13px">${hood.name}</strong>`, {
          closeButton: false,
        });
    }

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [lightMode]);

  return <div ref={wrapRef} className="h-full w-full" />;
}
