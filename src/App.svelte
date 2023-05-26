<script>
  import { onMount, onDestroy } from "svelte";
  import Dexie from "dexie";
  import TaskList from "./TaskList.svelte";
  import AddTask from "./AddTask.svelte";

  const db = new Dexie("TodoDB");
  db.version(1).stores({
    todos: "++id,text,startOfStreak,lastCompleted",
  });

  let tasks = [];

  async function addTask(newTask) {
    if (newTask.trim() !== "") {
      const task = {
        text: newTask,
        startOfStreak: Date.now(),
        lastCompleted: Date.now(),
      };
      await db.todos.add(task);
      tasks = [...tasks, task];
      newTask = "";
    }
  }

  async function resetStreak(task) {
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    // Reset streak if the task hasn't been completed within 24 hours
    if (
      task.lastCompleted != null &&
      currentTime - task.lastCompleted > twentyFourHours
    ) {
      task.startOfStreak = currentTime;
      task.lastCompleted = currentTime;

      await db.todos.update(task.id, {
        lastCompleted: null,
        startOfStreak: currentTime,
      });
      // Load tasks from database
      tasks = await db.todos.toArray();

      return true;
    }

    return false;
  }

  async function completeTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (await resetStreak(task)) return;
    await db.todos.update(id, {
      lastCompleted: Date.now(),
      startOfStreak: task.startOfStreak,
    });
    tasks = await db.todos.toArray();
  }

  async function removeTask(id) {
    await db.todos.delete(id);
    tasks = await db.todos.toArray();
  }

  async function markTasksAsUncompleted() {
    await Promise.all(tasks.map((task) => resetStreak(task)));
  }

  onMount(async () => {
    // Load tasks from database
    tasks = await db.todos.toArray();

    // Mark tasks as uncompleted after 24 hours
    markTasksAsUncompleted();
  });

  onDestroy(() => {
    // Clean up any resources before component is destroyed
    db.close();
  });
</script>

<main class="h-screen	flex justify-center mt-9">
  <div class="w-full md:w-2/5 mx-5">
    <div>
      <h1 class="text-4xl font-extrabold dark:text-white mb-10">Streaks ⚡</h1>
      <AddTask {addTask} />
    </div>

    <TaskList {tasks} {completeTask} {removeTask} />
  </div>
</main>

<style>
  /* Styles for the main App component */
</style>
