<script>
  import { onMount, onDestroy } from "svelte";
  import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
  } from "firebase/firestore";
  import { analytics, firestore, auth } from "./lib/firebase.js";
  import { signOut } from "firebase/auth";
  import { logEvent } from "firebase/analytics";
  import TaskList from "./TaskList.svelte";
  import AddTask from "./AddTask.svelte";
  import { ListPlaceholder } from "flowbite-svelte";
  import { Button } from "flowbite-svelte";

  let tasks = null;
  const timeOutDelay = 48 * 60 * 60 * 1000;
  const streakDelay = 24 * 60 * 60 * 1000;
  export let currentUid;

  async function updateTasksInState(updatedTasks) {
    tasks = updatedTasks;
  }

  async function updateTasksInFirestore(docRef, data) {
    await updateDoc(docRef, data);
    tasks = await loadTasks();
  }

  async function addTask(newTask) {
    if (newTask.trim() !== "") {
      const task = {
        text: newTask,
        startOfStreak: new Date(), // Store as Date object
        lastCompleted: new Date(), // Store as Date object
      };

      // Update local state optimistically
      const tempTask = { ...task, id: Date.now().toString() };
      updateTasksInState([...tasks, tempTask]);
      newTask = "";

      logEvent(analytics, "new_task_added");

      // Add the task to Firestore
      const userCollectionRef = collection(
        firestore,
        `users/${currentUid}/tasks`
      );
      const docRef = await addDoc(userCollectionRef, task);

      // Update the task with the Firestore document ID
      tempTask.id = docRef.id;
      const index = tasks.findIndex((t) => t.id === tempTask.id);
      tasks[index] = tempTask;
    }
  }

  async function resetStreak(task) {
    const currentTime = new Date();

    // Reset streak if the task hasn't been completed within 24 hours
    if (
      task.lastCompleted != null &&
      currentTime.getTime() - task.lastCompleted.getTime() > timeOutDelay
    ) {
      logEvent(analytics, "streak_expired", {
        startOfStreak: task.startOfStreak,
        lastCompleted: task.lastCompleted,
        currentTime: new Date(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        streak: calculateStreak(task),
      });

      task.startOfStreak = currentTime;
      task.lastCompleted = currentTime;

      // Update local state optimistically
      const updatedTasks = [...tasks];
      const index = updatedTasks.findIndex((t) => t.id === task.id);
      updatedTasks[index] = task;
      updateTasksInState(updatedTasks);

      const docRef = doc(firestore, `users/${currentUid}/tasks`, task.id);

      // Update the task in Firestore
      await updateTasksInFirestore(docRef, {
        lastCompleted: null,
        startOfStreak: currentTime,
      });

      return true;
    }

    return false;
  }

  function calculateStreak(task) {
    const startOfStreak =
      task.startOfStreak.getTime() == Date.now()
        ? 0
        : task.startOfStreak.getTime();
    const currentTime = Date.now();
    const timeElapsed = currentTime - startOfStreak;
    const streakDays = Math.floor(timeElapsed / streakDelay);
    return streakDays;
  }

  async function completeTask(id) {
    const task = tasks.find((t) => t.id === id);

    if (await resetStreak(task)) return;

    logEvent(analytics, "streak_extended", {
      minutesLeft:
        (new Date().getTime() - task.startOfStreak.getTime()) / 60 / 1000,
    });

    if (calculateStreak(task) === 7) {
      logEvent(analytics, "one_week_streak");
    }

    // Update local state optimistically
    const updatedTasks = [...tasks];
    const index = updatedTasks.findIndex((t) => t.id === task.id);
    updatedTasks[index].lastCompleted = new Date();
    updateTasksInState(updatedTasks);

    const docRef = doc(firestore, `users/${currentUid}/tasks`, id);

    // Update the task in Firestore
    await updateTasksInFirestore(docRef, {
      lastCompleted: new Date(),
      startOfStreak: task.startOfStreak,
    });
  }

  async function removeTask(id) {
    // Update local state optimistically
    const updatedTasks = tasks.filter((t) => t.id !== id);
    updateTasksInState(updatedTasks);

    const docRef = doc(firestore, `users/${currentUid}/tasks`, id);

    // Delete the task from Firestore
    await deleteDoc(docRef);

    logEvent(analytics, "task_removed");
  }

  async function loadTasks() {
    const userCollectionRef = collection(
      firestore,
      `users/${currentUid}/tasks`
    );
    const querySnapshot = await getDocs(userCollectionRef);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastCompleted: doc.data().lastCompleted
        ? doc.data().lastCompleted.toDate()
        : null,
      startOfStreak: doc.data().startOfStreak
        ? doc.data().startOfStreak.toDate()
        : null,
    }));
  }

  async function markTasksAsUncompleted() {
    await Promise.all(tasks.map((task) => resetStreak(task)));
  }

  onMount(async () => {
    // Load tasks from Firestore
    tasks = await loadTasks();

    // Mark tasks as uncompleted after timeout hours
    markTasksAsUncompleted();
  });

  onDestroy(() => {
    // Clean up any resources before component is destroyed
  });
</script>

<main class="flex justify-center mt-9">
  <div class="w-full md:w-3/5 lg:w-2/5 mx-5">
    <div>
      <div class="flex justify-between mb-10">
        <h1 class="text-4xl font-extrabold dark:text-white">Streaks ⚡</h1>
        <Button
          color="red"
          pill={true}
          outline={true}
          class="!p-2"
          size="xl"
          on:click={async () => await signOut(auth)}
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
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
            />
          </svg>
        </Button>
      </div>
      <AddTask {addTask} />
    </div>
    {#if tasks !== null}
      <TaskList {tasks} {completeTask} {removeTask} />
    {:else}
      <ListPlaceholder divClass="mt-9 w-full px-2" />
    {/if}
  </div>
</main>
