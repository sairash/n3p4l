<script setup lang="ts">

import { VueWinBox } from 'vue-winbox'

import TheWelcome from './components/Map.vue'
import { onMounted, ref } from 'vue';

import map from "@/assets/map.svg"

const count = ref(0)

const wbRef = ref()

const options = {
  title: 'Map',
  border: 8,
  x: "center",
  y: "center",
  width: 500,
  height: 500,
  minheight: 250,
  minwidth: 250,
  icon: map
}

</script>

<template>


  <div class="w-screen h-screen">

    <VueWinBox ref="wbRef" :options="options">
      <TheWelcome />
    </VueWinBox>
  </div>
 
</template>

<style>
.wb-full {
  display: none !important;
}
</style>