import "@maptiler/sdk/dist/maptiler-sdk.css";

import "@maptiler/geocoding-control/style.css";
import { Popup } from "@maptiler/sdk";

import "./style.css";

import { SETTINGS, apiKey } from "./settings.js";
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

  // Mute countries that aren't covered by the bathing sites dataset.
  // "EL" (the dataset's Eurostat-style code for Greece) maps to "GR" here,
  // since MapTiler's Countries tileset uses standard ISO 3166-1 alpha-2 codes.
  const datasetCountryCodes = [
    "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "GR", "ES", "FI", "FR",
    "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
    "SE", "SI", "SK",
  ];

  map.addSource("countries", {
    type: "vector",
    url: "https://api.maptiler.com/tiles/countries/tiles.json?key=" + apiKey,
  });

  map.addLayer({
    id: "countries_not_in_dataset",
    type: "fill",
    source: "countries",
    "source-layer": "administrative",
    filter: [
      "all",
      ["==", ["get", "level"], 0],
      ["!", ["in", ["get", "iso_a2"], ["literal", datasetCountryCodes]]],
    ],
    paint: {
      "fill-color": "#CBE2FE",
      "fill-opacity": 0.5,
    },
  });

  map.addLayer({
    id: "country_borders_in_dataset",
    type: "line",
    source: "countries",
    "source-layer": "administrative",
    filter: [
      "all",
      ["==", ["get", "level"], 0],
      ["in", ["get", "iso_a2"], ["literal", datasetCountryCodes]],
    ],
    paint: {
      "line-color": "#A0BDF7",
      "line-width": 0.75,
    },
  });

  // Bathing site locations
  map.addSource("bathing_sites", {
    type: "geojson",
    data: import.meta.env.BASE_URL + "bathing_sites.geojson",
  });

  // Rasterize the warning icon (7x7 SVG) into a map image at a higher
  // resolution so it stays crisp when scaled by icon-size per zoom.
  const warningIconImg = new Image();
  warningIconImg.src = import.meta.env.BASE_URL + "warning_icon.svg";
  await warningIconImg.decode();
  const iconCanvas = document.createElement("canvas");
  iconCanvas.width = 64;
  iconCanvas.height = 64;
  iconCanvas.getContext("2d").drawImage(warningIconImg, 0, 0, 64, 64);
  map.addImage(
    "warning-icon",
    iconCanvas.getContext("2d").getImageData(0, 0, 64, 64),
  );

  map.addLayer({
    id: "bathing_sites",
    type: "circle",
    source: "bathing_sites",
    filter: ["!=", ["get", "swimmable_polluted"], true],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 1.5, 8, 4, 12, 7],
      "circle-color": [
        "case",
        ["==", ["get", "quality_rating"], "0 - Not classified"], "#FFFFFF",
        ["==", ["get", "pollution_status"], "untested"], "#999999",
        ["==", ["get", "quality_rating"], "4 - Poor"], "#d73027",
        "#2ecc71",
      ],
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.85,
    },
  });

  map.addLayer({
    id: "bathing_sites_polluted_icon",
    type: "symbol",
    source: "bathing_sites",
    filter: ["==", ["get", "swimmable_polluted"], true],
    layout: {
      "icon-image": "warning-icon",
      "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.05, 8, 0.125, 12, 0.22],
      "icon-allow-overlap": true,
    },
  });

  const bathingPopup = new Popup({
    closeButton: false,
    closeOnClick: false,
  });

  const formatFailingSubstances = (value) =>
    value === "No data"
      ? "no chemical data"
      : value.split("; ").map((s) => s.replace(/^\S+\s-\s/, "")).join("; ");

  const bathingPopupHtml = (props) =>
    `<strong>${props.site_name}</strong> (${props.country})<br>` +
    `${props.quality_rating}<br>` +
    `${props.body_of_water}<br>` +
    `${formatFailingSubstances(props.failing_substances)}`;

  for (const layerId of ["bathing_sites", "bathing_sites_polluted_icon"]) {
    map.on("mouseenter", layerId, (e) => {
      map.getCanvas().style.cursor = "pointer";
      const props = e.features[0].properties;
      bathingPopup
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(bathingPopupHtml(props))
        .addTo(map);
    });

    map.on("mousemove", layerId, (e) => {
      const props = e.features[0].properties;
      bathingPopup
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(bathingPopupHtml(props));
    });

    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
      bathingPopup.remove();
    });
  }
});
