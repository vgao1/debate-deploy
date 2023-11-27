<script setup lang="ts">
import { ref, computed } from 'vue';

const sliderValue = ref(50);

// const sliderColor = computed(() => {
//   // Calculate the red and green components based on the slider value
//   const red = Math.max(255 - sliderValue.value * 5.1, 0);
//   const green = Math.min(sliderValue.value * 5.1, 255);
//   return `rgb(${red}, ${green}, 0)`;
// });

const sliderColor = computed(() => {
  // Define the start and end RGB values for dark purple and pink
  const startColor = { r: 75, g: 0, b: 130 }; // Dark purple
  const endColor = { r: 255, g: 192, b: 203 }; // Nice pink

  // Calculate the difference for each color component
  const diffColor = {
    r: endColor.r - startColor.r,
    g: endColor.g - startColor.g,
    b: endColor.b - startColor.b
  };

  // Calculate the current color based on the slider value
  const currentColor = {
    r: startColor.r + diffColor.r * (sliderValue.value / 100),
    g: startColor.g + diffColor.g * (sliderValue.value / 100),
    b: startColor.b + diffColor.b * (sliderValue.value / 100)
  };

  // Return the color in RGB format
  return `rgb(${Math.round(currentColor.r)}, ${Math.round(currentColor.g)}, ${Math.round(currentColor.b)})`;
});
</script>

<template>
  <div>
    <p class="font-bold pb-3 text-base">Your opinion</p>
    <!-- https://github.com/tailwindlabs/tailwindcss/discussions/8748 -->
    <input type="range" min="0" max="100" v-model="sliderValue" 
    class="range range-xs custom-slider" 
    />
    <!-- :style="{ background: sliderColor }"  -->
    <div class="w-full flex justify-between text-sm px-2">
      <span>Disagree</span>
      <span>Neutral</span>
      <span>Agree</span>
    </div>
    
    <div class="form-control">
      <label class="label">
        <span class="label-text font-bold"></span>
        <span class="label-text-alt"></span>
      </label>
      <textarea class="textarea textarea-bordered h-24 font-base" placeholder="Develop your opinion..."></textarea>
      <label class="label">
        <span class="label-text"></span>
        <span class="label-text-alt">(0/1000) words</span>
      </label>
    </div>

    <div class="flex justify-center">
      <button class="btn">Submit</button>
    </div>
  </div>
</template>

<style scoped>
/* .custom-slider::-webkit-slider-thumb {
  background-color: v-bind(sliderColor);
}
.custom-slider::-moz-range-thumb {
  background-color: v-bind(sliderColor);
}
.custom-slider::-ms-thumb {
  background-color: v-bind(sliderColor);
} */




</style>