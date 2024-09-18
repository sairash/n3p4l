<script setup lang="ts">
import { Coordinate, LineString, Map, TileLayer, VectorLayer } from 'maptalks';
import { ThreeLayer } from "maptalks.three";
import { AmbientLight, AnimationMixer, Clock, DirectionalLight, LightProbe, LoopRepeat, MeshPhongMaterial } from "three"

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LightProbeGenerator } from 'three/addons/lights/LightProbeGenerator.js';

import { onMounted, onUnmounted, ref } from 'vue';


import car from "@/assets/car.glb";
import { ACESFilmicToneMapping } from 'three/src/nodes/display/ToneMappingFunctions.js';
import { formatRouteData, RoutePlayer } from 'maptalks.routeplayer';
import type Model from 'maptalks.three/dist/Model';
import type { BaseLayerOptionType } from 'maptalks.three/dist/type';

const map_div = ref<HTMLElement>()


let position_capture_interval: number

let can_update_visited = true

let car_model: Model

interface player_info {
  coordinate: Array<number>;
  rotationX: number;
  rotationZ: number;
}

type ExtendedLayerOptionType = BaseLayerOptionType & {
  animation?: boolean;
};

const options: ExtendedLayerOptionType = {
  identifyCountOnEvent: 1,
  animation: true,
  forceRenderOnMoving: true,
  forceRenderOnRotating: true,
  forceRenderOnZooming: true
};


var line: LineString

const coordinates = [
  [85.33175, 27.708619],
  [85.331785, 27.708618],
  [85.332676, 27.708402],
  [85.332999, 27.708298],
  [85.333327, 27.708218],
  [85.333619, 27.708207],
  [85.333962, 27.708194],
  [85.335036, 27.708152],
  [85.335455, 27.708135],
  [85.336449, 27.708085],
  [85.335959, 27.703167],
  [85.33565, 27.703],
  [85.336285, 27.702783],
  [85.340226, 27.701458],
  [85.345342, 27.699329],
  [85.345344, 27.69923]];

const visited_cords: number[][] = []

var threeLayer: ThreeLayer


var animation_miixer: AnimationMixer
const clock = new Clock();

onMounted(() => {
  var map = new Map(map_div.value as HTMLElement, {
    center: coordinates[0],
    zoom: 18,
    maxZoom: 19,
    dragPitch: false,
    baseLayer: new TileLayer('base', {
      urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      subdomains: ["a", "b", "c", "d"],
      attribution: '<a href="http://osm.org">OpenStreetMap</a>'
    })
  });
  map.setPitch(60)

  var layer = new VectorLayer('vector', {}).addTo(map);

  line = new LineString(
    [],
    {
      symbol: {
        'lineColor': 'blue',
        'lineWidth': 10,
        'markerVerticalAlignment': 'middle',
        'markerWidth': 10,
        'markerHeight': 10
      }
    }
  ).addTo(layer);



  threeLayer = new ThreeLayer('t', options);



  const map_route_data = formatRouteData(coordinates, { duration: 1000 * 60 * 10 });
  const player = new RoutePlayer(map_route_data, { speed: 1, debug: true });


  const info = player.getStartInfo();

  threeLayer.prepareToDraw = function (gl, scene, camera) {
    const lightProbe = new LightProbe();
    scene.add(lightProbe);
    scene.add(new AmbientLight("#fff", 0.6))

    // light  
    const directionalLight1 = new DirectionalLight(0xffffff, 1.0);
    directionalLight1.position.set(10, 10, 10);
    scene.add(directionalLight1);


    var loader = new GLTFLoader();
    loader.load(car, function (gltf) {

      const model = gltf.scene;
      model.rotation.x = Math.PI / 2;
      model.scale.set(0.001, 0.001, 0.001);

      animation_miixer = new AnimationMixer(model)

      var clip = gltf.animations[0];
      var action = animation_miixer.clipAction(clip);
      action.loop = LoopRepeat
      action.play()


      car_model = threeLayer.toModel(model, { coordinate: info.coordinate });

      threeLayer.addMesh([car_model]);


      // const mixer = new AnimationMixer(model);

      update_position_of_car(info)

      player.on('playing', (e: player_info) => {
        update_position_of_car(e);
        if (can_update_visited) {
          can_update_visited = false
          visited_cords.push(e.coordinate)
          line.setCoordinates(visited_cords)
        }
      });

      player.play();


      animate();
    }, undefined, function (e) {

      console.error(e);

    });
  };

  threeLayer.addTo(map)


  position_capture_interval = setInterval(capture_current_position, 4500)

})


function animate() {
  var dt = clock.getDelta();
  if (animation_miixer) animation_miixer.update(dt);
  requestAnimationFrame(animate);
  if (threeLayer._needsUpdate) {
    threeLayer.redraw();
  }

}

onUnmounted(() => {
  clearInterval(position_capture_interval)
})

function rotation2Rad(rotation: number) {
  return (rotation) / 180 * Math.PI;
}


function update_position_of_car(e: player_info) {
  const { coordinate, rotationZ, rotationX } = e;
  if (!car_model) {
    return;
  }

  const altitude = coordinate[2];
  const v = threeLayer.coordinateToVector3(coordinate);
  car_model.getObject3d().position.copy(v);
  car_model.getObject3d().children[0].rotation.x = rotation2Rad(rotationX + 90);
  car_model.getObject3d().rotation.z = rotation2Rad(rotationZ + 90)
  car_model.setAltitude(altitude);
}


function capture_current_position() {
  can_update_visited = true
}



</script>

<template>
  <div ref="map_div" class="w-full h-full" style="overflow: hidden !important;">
  </div>
</template>

<style>
.maptalks-attribution {
  color: black;
  font-size: 10px;
  background-color: white;
}
</style>