<script setup lang="ts">
import DebatePrompt from "@/components/Home/DebatePrompt.vue";
import TextContainer from "@/components/TextContainer.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
// TODO(Nathan): retrieve debate from db
import debatesData from '@/assets/debates.json';

const debateIds = ["debate1", "debate2"]
const pastDebateIds = ["debate3", "debate4"]
</script>

<template>
  <div class="py-4">

    <TextContainer>
      <p class="text-base font-bold">Today's debates</p>
    </TextContainer>
    
    <div v-for="id in debateIds" class="flex flex-col">
      <TextContainer>
        <DebatePrompt :id="id"/>
      </TextContainer>
    </div>    

    <TextContainer>
      <p class="text-base font-bold">Past debates</p>
    </TextContainer>

    <div v-for="id in pastDebateIds" class="flex flex-col">
      <TextContainer>
        <DebatePrompt :id="id"/>
      </TextContainer>
    </div>    

</div>
</template>

