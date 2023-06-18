<script>
    import { afterUpdate, onMount } from "svelte";
    import safari from "./assets/safari.png";
    import share from "./assets/share.png";
    import { analytics } from "./lib/firebase.js";
    import { logEvent } from "firebase/analytics";
    import { tasksStore } from "./stores";
    import { scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    let installed = true;
    let onIOS = false;
    let deferredPrompt = undefined;
    let showRecently = true;
    let hasOneTask = false;

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });

    window.addEventListener("appinstalled", () => {
        deferredPrompt = undefined;
        installed = true;
    });

    const iOS = () => {
        return (
            [
                "iPad Simulator",
                "iPhone Simulator",
                "iPod Simulator",
                "iPad",
                "iPhone",
                "iPod",
            ].includes(navigator.platform) ||
            // iPad on iOS 13 detection
            (navigator.userAgent.includes("Mac") && "ontouchend" in document)
        );
    };

    const close = () => {
        showRecently = true;
        localStorage.setItem("lastShown", Date.now().toString());
    };

    const installPWA = async () => {
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            installed = true;
            close();
            logEvent(analytics, "pwa_prompt_accepted");
        } else {
            logEvent(analytics, "pwa_prompt_declined");
        }
    };

    onMount(async () => {
        onIOS = iOS();
        if (!window.matchMedia("(display-mode: standalone)").matches) {
            installed = false;
        }
        const lastShown = parseInt(localStorage.getItem("lastShown"));
        if (lastShown) {
            const now = Date.now();
            const diff = now - lastShown;
            const days = diff / (1000 * 60 * 60 * 24);
            if (days > 7) {
                showRecently = false;
            }
        } else {
            showRecently = false;
        }
    });

    tasksStore.subscribe((value) => {
        if (value.length === 0) {
            hasOneTask = false;
        } else {
            hasOneTask = true;
        }
    });

    afterUpdate(() => {
        if (
            !installed &&
            !showRecently &&
            hasOneTask &&
            (deferredPrompt !== undefined || onIOS)
        ) {
            logEvent(analytics, "pwa_prompt_shown", { on_ios: onIOS });
        }
    });
</script>

{#if !installed && !showRecently && hasOneTask && (deferredPrompt !== undefined || onIOS)}
    <div
        class="backdrop"
        in:scale={{ delay: 1500, duration: 0, easing: quintOut }}
    >
        <div
            class="pwaAdd p-5 bg-white border border-gray-200 rounded-3xl shadow"
            in:scale={{ delay: 1500, duration: 600, easing: quintOut }}
        >
            <div class="flex">
                <h5
                    class="mb-2 text-2xl font-semibold tracking-tight text-gray-900 inline-block"
                >
                    <span class="text-blue-500">Install</span> Streaks ⚡
                </h5>
                <div class="ml-auto inline-block">
                    <button on:click={close} id="close">close</button>
                </div>
            </div>
            <p class="mb-1 font-normal text-gray-500">
                Install the app on your device to easily access it anytime. No <span
                    class="text-sky-600">app store</span
                >
                or <span class="text-red-500">download</span> needed.
            </p>
            <p class="mb-3 font-normal text-gray-500">
                And access to exclusive features such as <span
                    class="font-semibold">push notifications</span
                >
                and <span class="font-semibold">offline support</span>.
            </p>
            {#if deferredPrompt}
                <button
                    class="bg-green-500 px-4 text-white text-base rounded-md"
                    on:click={installPWA}
                >
                    Install
                </button>
            {:else}
                <ol class="list-decimal font-normal text-gray-500 ml-7">
                    <li>
                        Open <span
                            class="underline decoration-indigo-300 decoration-2"
                            >Streaks</span
                        >
                        in safari
                        <img
                            class="inline-block pb-1"
                            width="16px"
                            src={safari}
                            alt="safari icon"
                        />
                    </li>
                    <li>
                        Tap on <img
                            class="inline-block pb-1"
                            width="16px"
                            src={share}
                            alt="share icon"
                        />
                    </li>
                    <li>
                        Select <button
                            class="bg-gray-500 px-2 text-slate-100 text-xs"
                            >Add to Home Screen</button
                        >
                    </li>
                </ol>
            {/if}
        </div>
    </div>
{/if}

<style>
    .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1000;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.25);
    }
    .pwaAdd {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(350px, 90%);
    }

    #close {
        overflow: hidden;
        position: relative;
        border: none;
        padding: 0;
        width: 2em;
        height: 2em;
        border-radius: 50%;
        background: transparent;
        color: #f21d1d;
        font: inherit;
        text-indent: 100%;
        cursor: pointer;
    }
    #close:focus {
        outline: solid 0 transparent;
        box-shadow: 0 0 0 2px #f98e8e;
    }
    #close:hover {
        background: rgba(161, 29, 29, 0.1);
    }
    #close:before,
    #close:after {
        position: absolute;
        top: 15%;
        left: calc(50% - 0.0625em);
        width: 0.125em;
        height: 70%;
        border-radius: 0.125em;
        transform: rotate(45deg);
        background: currentcolor;
        content: "";
    }
    #close:after {
        transform: rotate(-45deg);
    }
</style>
