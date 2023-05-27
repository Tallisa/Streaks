<script>
  import { onMount, onDestroy } from "svelte";
  import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
  import { app, analytics, firestore, auth } from "./lib/firebase.js";
    import { signOut } from "firebase/auth";
  import { logEvent } from "firebase/analytics";
  import TaskList from "./TaskList.svelte";
  import AddTask from "./AddTask.svelte";
  import { ListPlaceholder } from 'flowbite-svelte'
  import { Button } from 'flowbite-svelte';


  let tasks = null;
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
        startOfStreak: Date.now(),
        lastCompleted: Date.now(),
      };

      // Update local state optimistically
      const tempTask = { ...task, id: Date.now().toString() };
      updateTasksInState([...tasks, tempTask]);
      newTask = "";

      logEvent(analytics, 'new_task_added');

      // Add the task to Firestore
      const userCollectionRef = collection(firestore, `users/${currentUid}/tasks`);
      const docRef = await addDoc(userCollectionRef, task);

      // Update the task with the Firestore document ID
      tempTask.id = docRef.id;
      const index = tasks.findIndex(t => t.id === tempTask.id);
      tasks[index] = tempTask;
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

      // Update local state optimistically
      const updatedTasks = [...tasks];
      const index = updatedTasks.findIndex(t => t.id === task.id);
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

  async function completeTask(id) {
    const task = tasks.find((t) => t.id === id);

    if (await resetStreak(task)) return;

    logEvent(analytics, 'streak_extended', {
      minutesLeft: (Date.now() - task.startOfStreak) / 60 / 1000
    });

    // Update local state optimistically
    const updatedTasks = [...tasks];
    const index = updatedTasks.findIndex(t => t.id === task.id);
    updatedTasks[index].lastCompleted = Date.now();
    updateTasksInState(updatedTasks);

    const docRef = doc(firestore, `users/${currentUid}/tasks`, id);

    // Update the task in Firestore
    await updateTasksInFirestore(docRef, {
      lastCompleted: Date.now(),
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

    logEvent(analytics, 'task_removed');
  }

  async function loadTasks() {
    const userCollectionRef = collection(firestore, `users/${currentUid}/tasks`);
    const querySnapshot = await getDocs(userCollectionRef);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async function markTasksAsUncompleted() {
    await Promise.all(tasks.map((task) => resetStreak(task)));
  }

  onMount(async () => {
    // Load tasks from Firestore
    tasks = await loadTasks();

    // Mark tasks as uncompleted after 24 hours
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
        <Button color="red" pill={true} outline={true} class="!p-2" size="xl" on:click={async () => await signOut(auth)}>
          <svg class="w-6 h-6"
 fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"></path>
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