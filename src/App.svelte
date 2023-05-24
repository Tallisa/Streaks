<script>
  import { onMount } from "svelte";
  import Dexie from "dexie";

  const db = new Dexie("TodoDB");
  db.version(1).stores({
    todos: "++id,text,completed,timestamp",
  });

  let tasks = [];
  let newTask = "";

  async function addTask() {
    if (newTask.trim() !== "") {
      const task = {
        text: newTask,
        completed: false,
        timestamp: Date.now(),
      };
      await db.todos.add(task);
      tasks = [...tasks, task];
      newTask = "";
    }
  }

  async function completeTask(id) {
    await db.todos.update(id, { completed: true });
    tasks = tasks.map((task) => {
      if (task.id === id) {
        return { ...task, completed: true };
      }
      return task;
    });
  }

  async function removeTask(id) {
    await db.todos.delete(id);
    tasks = tasks.filter((task) => task.id !== id);
  }

  async function markTasksAsUncompleted() {
    const currentTime = Date.now();
    const updatedTasks = tasks.map((task) => {
      if (
        task.completed &&
        currentTime - task.timestamp >= 24 * 60 * 60 * 1000
      ) {
        return { ...task, completed: false };
      }
      return task;
    });
    tasks = updatedTasks;
    await Promise.all(
      updatedTasks.map((task) => db.todos.update(task.id, { completed: task.completed }))
    );
  }

  onMount(async () => {
    // Load tasks from database
    tasks = await db.todos.toArray();

    // Mark tasks as uncompleted after 24 hours
    markTasksAsUncompleted();
  });
</script>

<main>
  <h1>Todo App</h1>

  <input type="text" bind:value="{newTask}" placeholder="Enter a new task" />

  <button on:click="{addTask}">Add Task</button>

  <ul>
    {#each tasks as task}
      <li
        class="{task.completed ? 'completed' : ''}"
        on:click="{() => completeTask(task.id)}"
      >
        {task.text}
        <button on:click="{() => removeTask(task.id)}">Remove</button>
      </li>
    {/each}
  </ul>
</main>

<style>
  .completed {
    text-decoration: line-through;
  }
</style>
