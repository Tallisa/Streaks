<script>
  import { onMount } from "svelte";
  import TaskView from "./TaskView.svelte";
  import AuthView from "./AuthView.svelte";
  import { auth } from "./lib/firebase.js";
  import { registerSW } from "virtual:pwa-register";
  import InstallPWA from "./InstallPWA.svelte";

  registerSW({ immediate: true });

  let user = null;
  let loading = true;

  onMount(() => {
    // Firebase auth state listener
    const unsubscribe = auth.onAuthStateChanged((loggedInUser) => {
      user = loggedInUser;
      loading = false;
    });

    return () => {
      // Clean up the listener when the component is unmounted
      unsubscribe();
    };
  });
</script>

{#if loading}
  <div class="flex justify-center items-center h-screen">
    <span class="loader" />
  </div>
{:else if user}
  <TaskView currentUid={user.uid} />
{:else}
  <AuthView />
{/if}
<InstallPWA />

<style>
  .loader {
    height: 30px;
    width: 10px;
    border-radius: 4px;
    color: #fa0000;
    background: currentColor;
    position: relative;
    animation: ht 1s ease-in infinite alternate;
    box-shadow: 15px 0 0 -1px, -15px 0 0 -1px, 30px 0 0 -2px, -30px 0 0 -2px,
      45px 0 0 -3px, -45px 0 0 -3px;
  }

  @keyframes ht {
    100% {
      height: 0px;
    }
  }
</style>
