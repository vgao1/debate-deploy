<script setup lang="ts">
import PostListComponent from "@/components/Post/PostListComponent.vue";
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
const operations = [
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  }
]
const send_req = async (operation) => {
  if (operation.method === 'PATCH' || operation.method === 'POST') {
    fetchy(operation.endpoint, operation.method, operation.fields)
  } else {
    fetchy(operation.endpoint, operation.method, operation.fields)
  }
}
</script>

<template>
  <main>
    <h1>Backend Tester</h1>
    <section>
      <h1 v-if="isLoggedIn">Welcome {{ currentUsername }}!</h1>
      <h1 v-else>Please login!</h1>
    </section>
    <section id="operations">
      <h2>API Operations</h2>
      <ul v-if="isLoggedIn">
        <li v-for="operation of operations">
          <h3> {{operation.name}} </h3>
          <form class="operation-form">
            <input type="hidden" name="$endpoint" value="{{operation.endpoint}}" />
            <input type="hidden" name="$method" value="{{operation.method}}" />
            {{Object.entries(operation.fields)
              .map(([name, type]) => {
                const tag = type === "json" ? "textarea" : type;
                return `<div class="field">
                  <label for="${name}">${name}</label>
                  <{tag} name="${name}" id="${name}"></$tag}>
                </div>`;
              }
            }}).join("")}
            <button type="submit">Submit</button>
          </form>
        </li>
      </ul>
    </section>

    <section id="response">
      <h2>Response <span id="status-code"></span></h2>
      <pre id="response-text"></pre>
    </section>
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}
</style>
