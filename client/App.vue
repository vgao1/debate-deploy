<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { onBeforeMount, ref } from "vue";
import { RouterView, useRoute } from "vue-router";
import NavBottomBar from "./components/Nav/NavBottomBar.vue";

const userStore = useUserStore();
const currentRoute = useRoute();
const currentRouteName = ref();
const iconNames = ["Home", "Login"];

// Make sure to update the session before mounting the app in case the user is already logged in
onBeforeMount(async () => {
  try {
    await userStore.updateSession();
  } catch {
    // User is not logged in
  }
});

function getRouteName() {
  if (currentRoute.name) {
    currentRouteName.value = iconNames.includes(currentRoute.name.toString()) ? currentRoute.name.toString().toLowerCase() : "home";
  }
  return currentRouteName.value != undefined;
}
</script>

<template>
  <!-- <header>
    <nav>
      <div class="title">
        <img src="@/assets/images/logo.svg" />
        <RouterLink :to="{ name: 'Home' }">
          <h1>Social Media App</h1>
        </RouterLink>
      </div>
      <ul>
        <li>
          <RouterLink :to="{ name: 'Home' }" :class="{ underline: currentRouteName == 'Home' }"> Home </RouterLink>
        </li>
        <li v-if="isLoggedIn">
          <RouterLink :to="{ name: 'Settings' }" :class="{ underline: currentRouteName == 'Settings' }"> Settings </RouterLink>
        </li>
        <li v-else>
          <RouterLink :to="{ name: 'Login' }" :class="{ underline: currentRouteName == 'Login' }"> Login </RouterLink>
        </li>
      </ul>
    </nav>
    <article v-if="toast !== null" class="toast" :class="toast.style">
      <p>{{ toast.message }}</p>
    </article>
  </header> -->

  <!-- TODO: can't specify max width in the div instead of each child? -->
  <div class="">
    <RouterView class="max-w-sm mx-auto" />
    <NavBottomBar v-if="getRouteName()" :activeIcon="currentRouteName" class="max-w-sm mx-auto" />
  </div>
</template>

<style scoped>
@import "./assets/toast.css";

nav {
  padding: 1em 2em;
  background-color: lightgray;
  display: flex;
  align-items: center;
}

h1 {
  font-size: 2em;
  margin: 0;
}

.title {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

img {
  height: 2em;
}

a {
  font-size: large;
  color: black;
  text-decoration: none;
}

ul {
  list-style-type: none;
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 1em;
}

.underline {
  text-decoration: underline;
}
</style>
