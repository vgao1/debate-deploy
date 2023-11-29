<script setup lang="ts">
// TODO(Nathan): retrieve debate from db based on id
import debatesData from '@/assets/debates.json';
import WriteOpinionButton from './WriteOpinionButton.vue';
import ViewOpinionsButton from './ViewOpinionsButton.vue';
import router from "@/router";

// const props = defineProps({
//   id: {
//     type: String,
//     required: true
//   }
// })
// const debateId = props.id
// const debate = debatesData[debateId]
const props = defineProps(["debate"])
const debate = props.debate
const debateId = debate._id


function openDebate() {
    void router.push({ 
      path: `/debates/${debateId}`,
    });
}

function openOpinions() {
  console.log("open opinions")
    void router.push({ 
      path: `/debates/${debateId}/opinions`,
    });
}

</script>


<template>
  <div>  
    <!-- <button @click="openDebate"> -->
      <div class="border-l-2 pl-2 border-neutral-300 space-y-1">
        <div class="flex justify-between items-center">
          <b class="text-xs">{{ debate.category }}</b>
          
          <div v-if="debate.status != 'done'">
              <p class="text-xs text-lime-400">Due in 6h</p>
          </div>
          <div v-else>
            <p class="text-xs text-neutral-400">Done</p>
          </div>

        </div>
        <p class="pb-1">{{ debate.prompt }}</p>
      </div>
    <!-- </button> -->
      
    <WriteOpinionButton v-if="debate.status != 'done'" @click="openDebate" />
    <ViewOpinionsButton v-else @click="openOpinions"/>
  </div>
</template>

