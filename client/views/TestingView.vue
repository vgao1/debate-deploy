<script setup lang="ts">
import { ref } from "vue";

const statusCode = ref("");
const responseText = ref("");

const operations = [
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Signup",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Session",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
];

async function submitEventHandler(e: Event) {
  const form = e.target as HTMLFormElement;
  const formEntries = new FormData(form);
  const reqData: Record<string, any> = {};
  formEntries.forEach((val, key) => {
    if (key !== "$endpoint" && key !== "$method") {
      reqData[key as string] = val;
    }
  });

  // Replace :param with the actual value.
  let endpoint = (formEntries.get("$endpoint") as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const method = formEntries.get("$method") as string;
  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      credentials: "same-origin",
    },
  };

  statusCode.value = "";
  responseText.value = "Loading...";

  if (reqData) {
    if (method === "GET" || method === "DELETE") {
      const queryString = new URLSearchParams(reqData).toString();
      endpoint = `${endpoint}?${queryString}`;
    } else {
      fetchOptions.body = JSON.stringify(reqData);
    }
  }

  const response = await fetch(endpoint, fetchOptions);
  const result = await response.json();
  console.log(result, response);
  statusCode.value = response.status.toString() + " (" + response.statusText + ")";
  responseText.value = JSON.stringify(result, null, 2);
}
</script>

<template>
  <main>
    <h1>Backend Tester</h1>
    <div style="overflow: hidden">
      <section id="response" style="overflow: scroll; height: 25vh">
        <h2>
          Response <span id="status-code">{{ statusCode }}</span>
        </h2>
        <pre id="response-text"> {{ responseText }}</pre>
      </section>
      <section id="operations" style="overflow: scroll; height: 55vh">
        <h2>API Operations</h2>
        <ul>
          <li v-for="op of operations" :key="op.name" style="margin-bottom: 10px; margin-top: 10px">
            <h3>{{ op.name }}:</h3>
            <form class="operation-form" @submit.prevent="submitEventHandler">
              <input type="hidden" name="$endpoint" :value="op.endpoint" />
              <input type="hidden" name="$method" :value="op.method" />
              <div v-for="[field, tag] of Object.entries(op.fields)" :key="field" class="field" style="margin-left: 20px; margin-top: 10px">
                <label :for="field + 'field'">{{ field }}</label>
                <input v-if="tag === 'input'" :name="field" :id="field + 'field'" />
                <textarea v-else :name="field" :id="field + 'field'"></textarea>
              </div>
              <button type="submit" style="background-color: blue; margin-top: 10px; padding: 4px; margin-bottom: 10px">Submit</button>
            </form>
            <hr />
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}
</style>
