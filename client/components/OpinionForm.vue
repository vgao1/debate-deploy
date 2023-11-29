<script setup lang="ts">
import { fetchy } from "@/utils/fetchy";
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import router from '../router';
import OpinionSlider from './OpinionSlider.vue';

const route = useRoute()
const debateId = route.params.id
// true if the user has already submitted an opinion
const isEditing = ref(false);

const sliderValue = ref(50);
const opinionText = ref('');


// const sliderColor = computed(() => {
//   // Define an array of colors in the gradient
//   const colors = ['#e07a5f', '#de7c5d', '#d88258', '#ce8a53', '#c09453', '#b09d59', '#a0a466', '#93aa75', '#89ae84', '#84b090', '#81b297', '#81b29a'];
//   // Calculate the index of the color based on the slider value
//   const index = Math.floor((sliderValue.value / 100) * (colors.length - 1));
  
//   // Return the color at the calculated index
//   return colors[index];
// });

async function submitOpinion() {
  console.log('submitting opinion');
  const opinion = {
    content: opinionText.value,
    agree: sliderValue.value
  }
  console.log(opinion);

  //   const opinionJson = JSON.stringify(opinion);
  // Save to local storage
//   localStorage.setItem('userOpinion', opinionJson);

  try {
    await fetchy("/api/debate/submitOpinion", "POST", {
      body: { 
        debate: debateId, 
        content: opinionText.value, 
        likertScale: sliderValue.value 
     }
    });
  } catch (_) {
    return;
  }

  router.push({
    path: "/"
  })
}

function deleteOpinion() {
  console.log('deleting opinion');
  localStorage.removeItem('userOpinion');
  router.push({
    path: "/"
  })
}

function editOpinion() {
  console.log('editing opinion');
  submitOpinion();
  router.push({
    path: "/"
  })
}

onMounted(() => {
  // Retrieve opinion from local storage
//   const opinionJson = localStorage.getItem('userOpinion');
//   if (opinionJson) {
//     isEditing.value = true;
//     const opinion = JSON.parse(opinionJson);
//     opinionText.value = opinion.content;
//     sliderValue.value = opinion.agree;
//   }

})
</script>

<template>
  <div>
    <p class="font-bold pb-3 text-base">Your opinion</p>
    <!-- https://github.com/tailwindlabs/tailwindcss/discussions/8748 -->
    <!-- <input type="range" min="0" max="100" v-model="sliderValue" 
    class="range range-xs custom-slider" 
    :style="{ '--range-shdw': sliderColor }" 
    /> -->
    <OpinionSlider v-model="sliderValue"/>

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
      <textarea v-model="opinionText" class="textarea textarea-bordered h-24 font-base" placeholder="Develop your opinion..."></textarea>
      <label class="label">
        <span class="label-text"></span>
        <span class="label-text-alt">(0/1000) words</span>
      </label>
    </div>

    <div class="flex justify-center">
      <div v-if="isEditing" class="flex justify-center space-x-2">
        <button @click="editOpinion" class="btn">Edit</button>
        <button @click="deleteOpinion" class="btn btn-outline btn-error">Delete</button>
      </div>
      <div v-else class="flex justify-center space-x-2">
        <button @click="submitOpinion" class="btn">Submit</button>
      </div>
    </div>
  </div>
</template>
