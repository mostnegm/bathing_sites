import { SETTINGS, apiKey } from "./settings.js";

import { Map, config } from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import "@maptiler/geocoding-control/style.css";

// Vector style version of the background map
const source = "winter-v4";

// Generate the basic map
config.apiKey = apiKey;
export const map = new Map({
  container: "map", // container id
  style: source,
  center: [SETTINGS.center_lon, SETTINGS.center_lat],
  zoom: SETTINGS.zoom, // starting zoom
});

window._map = map;
