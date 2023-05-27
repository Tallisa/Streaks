<script>
  import Task from "./Task.svelte";
  import TaskCompleteConfirmation from "./TaskCompleteConfirmation.svelte";
  import TaskDeleteConfirmation from "./TaskDeleteConfirmation.svelte"
  

  let currentTask;
  let openOnCompleteModal = false;
  let openOnDeleteModal = false;

  export let tasks;
  export let completeTask;
  export let removeTask;

  const onCompleteTask = (task) => {
    currentTask = task;
    openOnCompleteModal = true;
  }

  const onDeleteTask = (task) => {
    currentTask = task;
    openOnDeleteModal = true;
  }

  const onConfirmCompletion = (task) => {
    openOnCompleteModal = false;
    currentTask = null;
    completeTask(task.id);
  }

  const onConfirmDeletion = (task) => {
    openOnDeleteModal = false;
    currentTask = null;
    removeTask(task.id);
  }

  const onCancel = (task) => {
    openOnCompleteModal = false;
    openOnDeleteModal = false;
    currentTask = null;
  }
</script>

<ul class="mt-9">
  {#each tasks as task}
    <Task {task} completeTask={onCompleteTask} removeTask={onDeleteTask} />
  {/each}
  {#if openOnCompleteModal === true}
    <TaskCompleteConfirmation task={currentTask} popupModal={openOnCompleteModal} onConfirm={onConfirmCompletion} onCancel={onCancel} />
  {/if}
  {#if openOnDeleteModal === true}
    <TaskDeleteConfirmation task={currentTask} popupModal={openOnDeleteModal} onConfirm={onConfirmDeletion} onCancel={onCancel} />
  {/if}
</ul>

<style>
  /* Styles for the TaskList component */
</style>
