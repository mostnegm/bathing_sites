import "@maptiler/sdk/dist/maptiler-sdk.css";

import "@maptiler/geocoding-control/style.css";
import { Popup } from "@maptiler/sdk";

import "./style.css";

import { SETTINGS } from "./settings.js";
import { map } from "./create_map.js";
import { createLegend, createSearchBar } from "./panels.js";

// we change the labels to be in the correct languages
map.on("load", () => {
  for (var label_type of [
    "Country labels",
    "City labels",
    "Continent labels",
  ]) {
    map.setLayoutProperty(label_type, "text-field", [
      "get",
      `name:${SETTINGS.language}`,
    ]);
  }
});

map.once("load", async () => {
  // Add legend
  createLegend();

  // Add search bar
  createSearchBar();

  // Bathing site locations
  map.addSource("bathing_sites", {
    type: "geojson",
    data: import.meta.env.BASE_URL + "bathing_sites.geojson",
  });

  map.addLayer({
    id: "bathing_sites",
    type: "circle",
    source: "bathing_sites",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 1.5, 8, 4, 12, 7],
      "circle-color": [
        "match",
        ["get", "quality_rating"],
        "1 - Excellent", "#2ecc71",
        "2 - Good", "#a6d96a",
        "3 - Sufficient", "#fdae61",
        "4 - Poor", "#d73027",
        "#999999",
      ],
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.85,
    },
  });

  const bathingPopup = new Popup({
    closeButton: false,
    closeOnClick: false,
  });

  const bathingPopupHtml = (props) =>
    `<strong>${props.site_name}</strong> (${props.country})<br>` +
    `${props.quality_rating}<br>` +
    `${props.body_of_water}`;

  map.on("mouseenter", "bathing_sites", (e) => {
    map.getCanvas().style.cursor = "pointer";
    const props = e.features[0].properties;
    bathingPopup
      .setLngLat(e.features[0].geometry.coordinates)
      .setHTML(bathingPopupHtml(props))
      .addTo(map);
  });

  map.on("mousemove", "bathing_sites", (e) => {
    const props = e.features[0].properties;
    bathingPopup
      .setLngLat(e.features[0].geometry.coordinates)
      .setHTML(bathingPopupHtml(props));
  });

  map.on("mouseleave", "bathing_sites", () => {
    map.getCanvas().style.cursor = "";
    bathingPopup.remove();
  });
});
