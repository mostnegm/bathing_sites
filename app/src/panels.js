import "@maptiler/sdk/dist/maptiler-sdk.css";

import "@maptiler/geocoding-control/style.css";
import { GeocodingControl } from "@maptiler/geocoding-control/maptilersdk";

import * as d3 from "d3";
import { apiKey, SETTINGS, translate } from "./settings";
import { map } from "./create_map";

export const median_thresholds    = [5, 40, 100, 200];
export const median_legend_limits = [40, 100, 200, ""];
export const median_legend_colors = ["#FFE3AE", "#FFAA00", "#FF3355", "#452D31"];

//  LEGEND
export const createLegend = () => {
  var w = document.getElementById("map-overlay").offsetWidth;

  const legend_height = 12;
  const legend_width = (w - 40) / 4;

  const legend_svg = d3
    .select("#map_legend")
    .append("svg")
    .attr("viewBox", `0 0 ${w - 40} 50`)
    .attr("width", "100%");

  legend_svg
    .selectAll("rect")
    .data(median_legend_colors)
    .enter()
    .append("rect")
    .attr("width", legend_width)
    .attr("height", legend_height)
    .attr("x", (d, i) => i * legend_width)
    .attr("y", 20)
    .attr("fill", (d) => d);

  legend_svg
    .selectAll("text")
    .data(median_legend_limits)
    .enter()
    .append("text")
    .attr("class", "legend-number")
    .attr("width", legend_width)
    .attr("text-anchor", "middle")
    .attr("x", (d, i) => (i + 1) * legend_width)
    .attr("y", (d, i) => (i % 2 ? 15 : 48))
    .text((d) => `${d}`);
};

export const updateLegend = (limits, colors) => {
  d3.select("#map_legend").selectAll("rect")
    .data(colors)
    .attr("fill", (d) => d);
  d3.select("#map_legend").selectAll("text")
    .data(limits)
    .text((d) => `${d}`);
};

// SEARCH PANEL
export function createSearchBar() {
  // Add search place feature
  var bbox = [-20.654297, 26.431228, 31.113281, 71.524909];
  const gc = new GeocodingControl({
    apiKey: apiKey,
    bbox: bbox,
    language: SETTINGS.language,
    types: [
      "region",
      "joint_municipality",
      "joint_submunicipality",
      "municipality",
      "locality",
    ],
    placeholder: "search_placeholder",
  });
  map.addControl(gc, "top-left");
}
