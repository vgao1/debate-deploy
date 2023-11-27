<script setup lang="ts">
import router from "@/router";
// TODO(Nathan): retrieve debate from db based on id
import debatesData from '@/assets/debates.json';


// TODO(Nathan): add debate id?
const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const debate = debatesData[props.id]

function openDebate() {
  void router.push({ 
    path: `/debates/${props.id}`,
  });
}

</script>


<template>
  <div>  
    <div class="border-l-2 pl-2 border-neutral-300 space-y-1">
      <div class="flex justify-between items-center">
        <b class="text-xs">{{ debate.category }}</b>
        <p class="text-xs text-lime-400">Due in 6h</p>
      </div>
      <p class="pb-1">{{ debate.prompt }}</p>
    </div>
  
    <div class="flex align-middle pt-3 space-x-1">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>

      <button @click="openDebate" class="font-normal text-sm">Write your opinion...</button>
    </div>
  </div>
</template>

