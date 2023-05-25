<script>
  export let task;
  export let completeTask;
  export let removeTask;

  function calculateStreak(startOfStreak) {
    startOfStreak = startOfStreak == Date.now() ? 0 : startOfStreak;
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const timeElapsed = currentTime - startOfStreak;
    const streakDays = Math.floor(timeElapsed / twentyFourHours);
    return streakDays;
  }
</script>

<li on:click={() => completeTask(task.id)}>
  {task.text}
  <span class="streak">{calculateStreak(task.startOfStreak)}</span>
  <span class="streak">{task.lastCompleted}</span>
  <button on:click={() => removeTask(task.id)}>Remove</button>
</li>

<style>
  /* Styles for the Task component */
</style>
