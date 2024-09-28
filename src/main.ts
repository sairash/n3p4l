import './style.css'

import nepal_json from "./nepal-wards.json"

import Leaflet, { LatLngTuple } from "leaflet"
import "leaflet/dist/leaflet.css"

import {visiting_points} from "./visiting_points";
import { findNearestRoad } from './nearestRoad';

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
// console.log(calculateCentroid(nepal_json_ts));


// visiting_points.forEach(points => {
//   Leaflet.circle(points as LatLngTuple, {
//     radius: 500
//   }).addTo(map)
//});
Leaflet.circle(visiting_points[0] as LatLngTuple, {
  radius: 500
}).addTo(map)


const near_road = await findNearestRoad(visiting_points[0][0], visiting_points[0][1])

if(near_road != null){
  Leaflet.marker([near_road.lat, near_road.lon]).addTo(map)
}

// findNearestRoad(visiting_points[1][0], visiting_points[1][1])
// findNearestRoad(visiting_points[2][0], visiting_points[2][1])
// findNearestRoad(visiting_points[3][0], visiting_points[3][1])
