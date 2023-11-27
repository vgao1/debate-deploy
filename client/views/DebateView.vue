<script setup lang="ts">
import BackArrowHeader from "@/components/Nav/BackArrowHeader.vue";
import OpinionForm from "@/components/OpinionForm.vue";
import TextContainer from "@/components/TextContainer.vue";
import { useRoute } from 'vue-router';

// TODO(Nathan): retrieve debate from db based on id
import debatesData from '@/assets/debates.json';

const route = useRoute()
const debateId = route.params.id
const debate = debatesData[debateId]

</script>

<template>
  <div class="py-4">

    <TextContainer>
      <BackArrowHeader text="Debate"/>
    </TextContainer>
 
    <TextContainer>
      <div class="flex justify-center">
        <div>
          <p class=" text-base">Due at <b>8pm</b></p>
          <p class="text-sm">6h remaining</p>
        </div>
      </div>
    </TextContainer>
 
    <TextContainer>
      <div class="border-l-0 border-neutral-300 space-y-1">
        <div class="flex justify-between items-center">
          <b class="text-sm">{{ debate.category }}</b>
          <!-- <p class="text-sm text-lime-400">Due in 6h</p> -->
        </div>
        <p class="pb-1 text-base">{{ debate.prompt }}</p>
      </div>
    </TextContainer>

    <TextContainer>
      <OpinionForm />
    </TextContainer>
    
</div>
</template>

