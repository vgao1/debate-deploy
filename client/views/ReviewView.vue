<script setup lang="ts">
import BackArrowHeader from "@/components/Nav/BackArrowHeader.vue";
import OpinionSlider from "@/components/OpinionSlider.vue";
import TextContainer from "@/components/TextContainer.vue";
import { ref, watch } from "vue";

// TODO: sum larger than 100
const totalValue = 100;
const numberOfSliders = 3;
const sliderValues = ref(Array(numberOfSliders).fill(totalValue / numberOfSliders));

// Setting up individual watchers for each slider
for (let i = 0; i < numberOfSliders; i++) {
  watch(
    () => sliderValues.value[i],
    (newValue, oldValue) => {
      const currentTotal = sliderValues.value.reduce((a, b) => a + b, 0);
      // don't update if the currentTotal is already close to total in absolute value
      if (Math.abs(currentTotal - totalValue) < 1) {
        return;
      }

      const remainingValue = totalValue - newValue;
      const otherSliders = sliderValues.value.filter((_, index) => index !== i);

      const otherSlidersSum = otherSliders.reduce((a, b) => a + b, 0);
      const multiplier = remainingValue / otherSlidersSum;

      for (let j = 0; j < numberOfSliders; j++) {
        if (j !== i) {
          sliderValues.value[j] = sliderValues.value[j] * multiplier;
        }
      }
    },
  );
}
</script>

<template>
  <div class="py-4">
    <TextContainer>
      <BackArrowHeader text="Debate" />
    </TextContainer>

    <TextContainer>
      <div class="space-y-2">
        <div v-for="(sliderValue, index) in sliderValues" :key="index">
          Review {{ index + 1 }}
          <OpinionSlider v-model="sliderValues[index]" />
        </div>
      </div>
    </TextContainer>
  </div>
</template>
