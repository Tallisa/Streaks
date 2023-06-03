<script>
  import { onMount, onDestroy, afterUpdate } from "svelte";

  export let task;
  export let completeTask;
  export let removeTask;

  let expireTime;
  let streak;
  let hoursLeft;
  let minsLeft;
  let interval; // Variable to store the interval ID

  const timeOutDelay = 48 * 60 * 60 * 1000;
  const streakDelay = 24 * 60 * 60 * 1000;

  const calculateStreak = () => {
    if (task.startOfStreak == null) {
      streak = "🏁";
      return;
    }
    const currentTime = Date.now();
    const timeElapsed = currentTime - task.startOfStreak.getTime();
    const streakDays = Math.floor(timeElapsed / streakDelay);

    if (streakDays < 1) {
      streak = "🏁";
    } else {
      streak = streakDays + "x🔥";
    }
  };

  const calculateDeadline = () => {
    if (task.lastCompleted == null) {
      expireTime = `expired`;
      hoursLeft = 0;
      minsLeft = 0;
      task.startOfStreak = null;
      return;
    }
    const deadline = task.lastCompleted.getTime() + timeOutDelay - Date.now();
    hoursLeft = Math.floor(deadline / (60 * 60 * 1000));
    minsLeft = Math.floor(deadline / (60 * 1000));
    if (hoursLeft <= 1) {
      expireTime = `${minsLeft} mins left`;
    } else {
      expireTime = `${hoursLeft} hours left`;
    }
  };

  const changeFontColor = (value) => {
    // Adjust the scale from 0-23 to 0-100
    var adjustedValue = 48 - value;
    var percentage = (adjustedValue / 48) * 100;

    // Apply an ease-in effect using a cubic-bezier function
    var easingPercentage = cubicBezierEaseIn(percentage / 100);

    // Calculate the intermediate color values with the eased percentage
    var r = Math.round((255 - 120) * easingPercentage + 120);
    var g = Math.round((0 - 113) * easingPercentage + 113);
    var b = Math.round((0 - 108) * easingPercentage + 108);

    // Create the color string in RGB format
    var color = "rgb(" + r + "," + g + "," + b + ")";

    // Set the background color of the div
    document.getElementById(`timeLeft_${task.id}`).style.color = color;
  };

  // Easing function (Cubic Bezier Ease-In)
  const cubicBezierEaseIn = (t) => {
    return t * t * t;
  };

  const recalculate = () => {
    calculateDeadline();
    calculateStreak();
    changeFontColor(hoursLeft);
  };

  onMount(() => {
    // Initial calculations
    recalculate();

    // Start the interval to recalculate every minute
    interval = setInterval(recalculate, 60000);
  });

  onDestroy(() => {
    // Clear the interval when the component is destroyed
    clearInterval(interval);
  });

  afterUpdate(() => {
    calculateDeadline();
    calculateStreak();
    changeFontColor(hoursLeft);
  });
</script>

<li>
  <div class="flex flex-row my-3 px-2">
    <div class="flex-grow limit-overflow">
      <div class="break-words text-lg font-normal text-gray-800">
        {task.text}
      </div>
      <div id={`timeLeft_${task.id}`} class="break-words text-sm font-normal">
        <span class="ml-auto">{expireTime}</span>
      </div>
    </div>
    <div class="ml-auto my-auto w-auto flex flex-row justify-end">
      <div class="pl-2 pr-1 h-6 streak">{streak}</div>
      <button
        class="px-1"
        data-modal-target={`popup-modal-${task.id}`}
        data-modal-toggle={`popup-modal-${task.id}`}
        on:click={() => completeTask(task)}
        type="button"
      >
        <svg
          fill="none"
          class="w-6 h-6 text-green-600 hover:bg-green-200"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      <button class="pl-1" on:click={() => removeTask(task)}>
        <svg
          fill="none"
          class="w-6 h-6 text-red-600 hover:bg-red-200"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      </button>
    </div>
  </div>
</li>

<style>
  .limit-overflow {
    max-width: 247px;
  }
  .streak {
    width: 75px;
    text-align: right;
  }
</style>
