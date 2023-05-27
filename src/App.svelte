<script>
  import { onMount, onDestroy } from "svelte";
  import Dexie from "dexie";
  import TaskList from "./TaskList.svelte";
  import AddTask from "./AddTask.svelte";
  import { analytics } from "./lib/firebase.js"
  import { logEvent } from "firebase/analytics";


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
      logEvent(analytics, 'new_task_added');
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
      logEvent(analytics, 'streak_expired', {
        startOfStreak: task.startOfStreak,
        lastCompleted: task.lastCompleted,
        currentTime: Date.now(),
      });
      
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
      logEvent(analytics, 'streak_extended', {
        minutesLeft: (Date.now() - task.startOfStreak) / 60 / 1000
      });
      await db.todos.update(id, {
      lastCompleted: Date.now(),
      startOfStreak: task.startOfStreak,
    });

    tasks = await db.todos.toArray();
  }

  async function removeTask(id) {
    await db.todos.delete(id);
    tasks = await db.todos.toArray();
    logEvent(analytics, 'task_removed');
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

<main class="flex justify-center mt-9">
  <div class="w-full md:w-3/5 lg:w-2/5 mx-5">
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
