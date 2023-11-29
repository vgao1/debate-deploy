<script setup lang="ts">
import DebatePrompt from "@/components/Home/DebatePrompt.vue";
import TextContainer from "@/components/TextContainer.vue";
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
// TODO(Nathan): retrieve debate from db

const debateIds = ["debate1", "debate2"]
const pastDebateIds = ["debate3", "debate4"]
// const debateIds = ref<Array<Record<string, string>>>([]);
const debates = ref<Array<Record<string, string>>>([]);
const loaded = ref(false);

async function getDebates() {
  let res;
  try {
    res = await fetchy("/api/debate/getDebates", "GET", {});
  } catch (_) {
    return;
  }
  console.log("getDebates", res)
  debates.value = res;
}

onBeforeMount(async () => {
  await getDebates();
  loaded.value = true;
});

</script>

<template>
  <div v-if="loaded" class="py-4">

    <TextContainer>
      <p class="text-base font-bold">Today's debates</p>
    </TextContainer>
    
    <div v-for="debate in debates" class="flex flex-col">
      <TextContainer>
        <DebatePrompt :debate="debate"/>
      </TextContainer>
    </div>    
    <!-- <div v-for="id in debateIds" class="flex flex-col">
      <TextContainer>
        <DebatePrompt :id="id"/>
      </TextContainer>
    </div>     -->

    <TextContainer>
      <p class="text-base font-bold">Past debates</p>
    </TextContainer>

    <!-- <div v-for="id in pastDebateIds" class="flex flex-col">
      <TextContainer>
        <DebatePrompt :id="id"/>
      </TextContainer>
    </div>     -->

</div>
</template>

