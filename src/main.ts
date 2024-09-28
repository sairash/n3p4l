import './style.css'

import nepal_json from "./nepal-wards.json"

import Leaflet, { LatLngTuple } from "leaflet"
import "leaflet/dist/leaflet.css"

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

type GeoJSONFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon" | "LineString";
    coordinates: number[][][] | number[][];
  };
  properties: Record<string, any>;
};


type GeoJSON = {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
};


const nepal_json_ts = nepal_json as GeoJSON


function calculateCentroid(geojson: GeoJSON): Number[][]  {
  const center_points: Number[][] = []
  console.log(geojson.features.length)
  geojson.features.forEach(feature => {
    if(feature.geometry == null){
      return
    }
    const { coordinates } = feature.geometry;

    let totalLat = 0, totalLng = 0;
    if(coordinates[0] != undefined && coordinates[0].length > 0){
      (coordinates[0] as number[][]).forEach(coord => {
        totalLng += coord[0];
        totalLat += coord[1];
      });
      const lat_lng_center = [totalLat / coordinates[0].length, totalLng / coordinates[0].length]
      if(!Number.isNaN(lat_lng_center[0])){
        center_points.push(lat_lng_center)
        Leaflet.circle(lat_lng_center as LatLngTuple, {
          radius: 500
        }).addTo(map)
      }
    }
  });

  return center_points
}

var map = Leaflet.map("map").setView([28.99026528599369,
                           81.3371992082871], 13)

Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Call the function
console.log(calculateCentroid(nepal_json_ts));


