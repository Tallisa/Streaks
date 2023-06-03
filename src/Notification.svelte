<script>
  import { onMount } from "svelte";
  import { Button } from "flowbite-svelte";
  import { getToken } from "firebase/messaging";
  import { logEvent } from "firebase/analytics";
  import { messaging, firestore, analytics, auth } from "./lib/firebase.js";
  import { updateDoc, doc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";

  let isNotificationsEnabled = false;
  let disabled = false;
  const vapidKey = "BHdTrqFY8NJ5AitYs9KRtmCGvmHEPzB0UC15hAfmuBVyC4kqvpFufodywJlk7WGaCT5QLDMY2TomDqfMs77xGWM";
  const userId = auth.currentUser.uid;
  const userRef = doc(firestore, 'users', userId);

  const disableNotifications = async () => {
    try {
      isNotificationsEnabled = false;
      
      await updateDoc(userRef, {
        fcmEnabled: false,
      });

      const pushToken = await getPushToken();
      if(pushToken) {
        await updateDoc(userRef, {
          fcmTokens: arrayRemove(pushToken),
        });
      }
    } catch (error) {
      console.error("Error disabling notifications:", error);
    }
  };

  const enableNotifications = async () => {
    const pushToken = await getPushToken();
    if(!pushToken) return;
    
    isNotificationsEnabled = true;
    
    try {
      await updateDoc(userRef, {
        fcmEnabled: true,
      });
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(pushToken),
      });
    } catch (error) {
      console.error("Error enabling notifications:", error);
    }
  };

  const getPushToken = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return null;
      
      const registration = await navigator.serviceWorker.register(
        import.meta.env.MODE === "production"
          ? "/sw.js"
          : "/dev-sw.js?dev-sw",
        {
          type: import.meta.env.MODE === "production" ? "classic" : "module",
        }
      );
      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration,
      });

      return currentToken;
    } catch (error) {
      console.error("An error occurred while getting push token:", error);
      return null;
    }
  }

  onMount(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      disabled = true;
    } else {
      isNotificationsEnabled = (await getDoc(userRef)).data().fcmEnabled;

      if (isNotificationsEnabled && Notification.permission != "granted"){
        isNotificationsEnabled = false;
        
        await updateDoc(userRef, {
          fcmEnabled: false,
        });
      }
    }
  });
</script>


{#if !disabled}
  {#if isNotificationsEnabled}
    <Button
      color="green"
      pill={true}
      outline={true}
      class="!p-2"
      size="xl"
      on:click={disableNotifications}
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5"
        />
      </svg>
    </Button>
  {:else}
    <Button
      color="red"
      pill={true}
      outline={true}
      class="!p-2"
      size="xl"
      on:click={enableNotifications}
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003A8.967 8.967 0 0118 9.75V9A6 6 0 006.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53"
        />
      </svg>
    </Button>
  {/if}
{/if}
