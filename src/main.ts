import './style.css'

import nepal_json from "./nepal-wards.json"

import Leaflet, { latLngBounds, LatLngTuple, PointTuple } from "leaflet"
import "leaflet/dist/leaflet.css"

import { visiting_points } from "./visiting_points";
import { findNearestRoad } from './nearestRoad';
import axios from 'axios';
import Geohash from 'latlon-geohash';



const prev = document.getElementById("prev") as HTMLInputElement
const next = document.getElementById("next") as HTMLInputElement
const prefix = document.getElementById("prefix") as HTMLInputElement
const amount = document.getElementById("amount") as HTMLInputElement
const working_dom_amount = document.getElementById("working") as HTMLElement

prev.onclick = stop;
next.onclick = convert_to_geohash_and_plot;

let work = false

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


interface location_with_id {
  lat_lng: number[],
  vdc_code: number,
  district: string,
  vdc_name: string,
  zone_name: string,
  region: string
}

const nepal_json_ts = nepal_json as GeoJSON


function calculateCentroid(geojson: GeoJSON): location_with_id[] {
  const center_points: location_with_id[] = []
  console.log(geojson.features.length)
  geojson.features.forEach(feature => {
    if (feature.geometry == null) {
      return
    }
    const { coordinates } = feature.geometry;

    let totalLat = 0, totalLng = 0;
    if (coordinates[0] != undefined && coordinates[0].length > 0) {
      (coordinates[0] as number[][]).forEach(coord => {
        totalLng += coord[0];
        totalLat += coord[1];
      });
      const lat_lng_center = [totalLat / coordinates[0].length, totalLng / coordinates[0].length]
      if (!Number.isNaN(lat_lng_center[0])) {
        center_points.push({
          lat_lng: lat_lng_center,
          vdc_code: feature.properties.VDC_CODE as number,
          district: feature.properties.DISTRICT as string,
          vdc_name: feature.properties.VDC_NAME as string,
          zone_name: feature.properties.ZONE_NAME as string,
          region: feature.properties.REGION as string
        })
        Leaflet.circle(lat_lng_center as LatLngTuple, {
          radius: 500
        }).addTo(map)
      }
    }
  });

  return center_points
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


var map = Leaflet.map("map").setView([28.99026528599369,
  81.3371992082871], 13)

Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Call the function
// console.log(calculateCentroid(nepal_json_ts));

console.log("Total Visting Points: ", visiting_points.length - 1)


function geo_hash_gen(lat: number, lng: number, amount: number = 5, color: string = "#ff0"): string{
  const geo_hash_of_road = Geohash.encode(lat, lng, amount)
  const bounds = Geohash.bounds(geo_hash_of_road)
  Leaflet.rectangle(latLngBounds([bounds.sw.lat, bounds.sw.lon], [bounds.ne.lat, bounds.ne.lon])).setStyle({
    fillColor: color
  }).addTo(map)
  return geo_hash_of_road
}

async function convert_to_geohash_and_plot() {
  let geo_hash_large: { [key: string]: string[] } = {};
  let geo_hash_small: { [key: string]: number[] } = {};
  visiting_points.forEach((element, index) => {
    const large_hash = geo_hash_gen(element.nearest_road_lat_lng[0],element.nearest_road_lat_lng[1], 4)
    const small_hash = geo_hash_gen(element.nearest_road_lat_lng[0],element.nearest_road_lat_lng[1], 5, "#f00")
    geo_hash_large[large_hash] = geo_hash_large[large_hash] == undefined? [small_hash]:[...geo_hash_large[large_hash], small_hash];
    geo_hash_small[small_hash] = geo_hash_small[small_hash] == undefined? [index]: [...geo_hash_small[small_hash], index];
  });

  // console.log(geo_hash_large)
  // console.log(geo_hash_small)
}

async function start() {
  work = true
  for (let index = Number(prefix.value); index < visiting_points.length && index <= Number(amount.value); index++) {
    if (!work) {
      break;
    }
    working_dom_amount.innerText = `${index}`
    const element = visiting_points[index];

    map.setView(element.lat_lng as Leaflet.LatLngTuple, 13)

    Leaflet.circle(element.lat_lng as LatLngTuple, {
      radius: 500
    }).addTo(map)

    try {

      let around = 500
      let near_road = null
      while (near_road == null) {
        near_road = await findNearestRoad(element.lat_lng[0], element.lat_lng[1], around)
        around += 500

        if (near_road != null) {
          Leaflet.marker([near_road.lat, near_road.lon]).addTo(map)

          const resp = await axios.post("http://127.0.0.1:5000/store-data", {
            ...element, "new_lat_lng": [near_road.lat, near_road.lon]
          })
          console.log(resp.data)
        }
      }
    } catch (error) {
      console.log("Error on:", index, "Vdc Code: ", element.vdc_code, "Vdc Name: ", element.vdc_name)
      console.error(error)
      break;
    }

    await delay(500);

  }

  work = false
}

function stop() {
  work = false
}




// findNearestRoad(visiting_points[1][0], visiting_points[1][1])
// findNearestRoad(visiting_points[2][0], visiting_points[2][1])
// findNearestRoad(visiting_points[3][0], visiting_points[3][1])
