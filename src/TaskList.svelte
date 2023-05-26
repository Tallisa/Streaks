<script>
  import Task from "./Task.svelte";

  export let tasks;
  export let completeTask;
  export let removeTask;
</script>

<ul class="mt-9">
  {#each tasks as task}
    <Task {task} {completeTask} {removeTask} />
  {/each}
</ul>

<style>
  /* Styles for the TaskList component */
</style>
