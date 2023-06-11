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
  import Notification from "./Notification.svelte";
  import { ListPlaceholder } from "flowbite-svelte";
  import { Button } from "flowbite-svelte";

  let tasks = null;
  const timeMultiplier = 60 * 1000;
  export let currentUid;

  const addTask = async (newTask) => {
    if (newTask.trim() !== "") {
      const task = {
        text: newTask,
        description: "",
        streak: 0,
        taskDuration: 24 * 60,
        timeOutDelay: 48 * 60,
        streakStartedAt: new Date(),
        lastCompletedAt: new Date(),
        streakExtendAt: new Date(Date.now() + 24 * 60 * timeMultiplier),
        expiresAt: new Date(Date.now() + 48 * 60 * timeMultiplier),
        ...getReminder(48 * 60),
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
  };

  const completeTask = async (id) => {
    let task = tasks.find((t) => t.id === id);

    if (task.expiresAt) {
      logEvent(analytics, "streak_extended", {
        minutesLeft:
          (new Date().getTime() - task.expiresAt.getTime()) / 60 / 1000,
      });
    } else {
      logEvent(analytics, "streak_restarted");
    }

    task.lastCompletedAt = new Date();
    task.expiresAt = new Date(Date.now() + task.timeOutDelay * timeMultiplier);

    if (task.streakExtendAt < new Date()){
      task.streak = task.streak + 1;
      task.streakExtendAt = new Date(Date.now() + (task.taskDuration * timeMultiplier));
    }

    if (!task.streakStartedAt) {
      task.streakStartedAt = new Date();
    }

    task = { ...task, ...getReminder(task.timeOutDelay) };

    // Update local state optimistically
    const updatedTasks = [...tasks];
    const index = updatedTasks.findIndex((t) => t.id === task.id);
    updatedTasks[index] = task;

    updateTasksInState(updatedTasks);

    const docRef = doc(firestore, `users/${currentUid}/tasks`, id);

    // Update the task in Firestore
    await updateTasksInFirestore(docRef, {
      lastCompletedAt: new Date(),
      expiresAt: new Date(Date.now() + task.timeOutDelay * timeMultiplier),
      streakStartedAt: task.streakStartedAt,
      streakExtendAt: task.streakExtendAt,
      streak: task.streak,
      ...getReminder(task.timeOutDelay),
    });
  };

  const removeTask = async (id) => {
    // Update local state optimistically
    const updatedTasks = tasks.filter((t) => t.id !== id);
    updateTasksInState(updatedTasks);

    const docRef = doc(firestore, `users/${currentUid}/tasks`, id);

    // Delete the task from Firestore
    await deleteDoc(docRef);

    logEvent(analytics, "task_removed");
  };

  const loadTasks = async () => {
    const userCollectionRef = collection(
      firestore,
      `users/${currentUid}/tasks`
    );
    const querySnapshot = await getDocs(userCollectionRef);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        lastCompletedAt: data.lastCompletedAt
          ? data.lastCompletedAt.toDate()
          : null,
        streakStartedAt: data.streakStartedAt
          ? data.streakStartedAt.toDate()
          : null,
        streakExtendAt: data.streakExtendAt
          ? data.streakExtendAt.toDate()
          : null,
        expiresAt: data.expiresAt ? data.expiresAt.toDate() : null,
      };
    });
  };

  const updateTasksInState = (updatedTasks) => {
    tasks = updatedTasks;
  };

  const updateTasksInFirestore = async (docRef, data) => {
    await updateDoc(docRef, data);
    tasks = await loadTasks();
  };

  const getReminder = (timeOutDelay) => {
    const halfWay = new Date(Date.now() + (timeOutDelay * timeMultiplier) / 2);
    const expiresAt = new Date(Date.now() + timeOutDelay * timeMultiplier);
    const fiveHoursBefore = new Date(
      expiresAt.getTime() - 5 * 60 * timeMultiplier
    );
    const thirtyMinsBefore = new Date(
      expiresAt.getTime() - 30 * timeMultiplier
    );

    return {
      nextReminder: { type: "half_way", time: halfWay },
      reminders: [
        { type: "five_hours_left", time: fiveHoursBefore },
        { type: "thirty_minutes_left", time: thirtyMinsBefore },
        { type: "expired", time: expiresAt },
      ],
    };
  };

  onMount(async () => {
    tasks = await loadTasks();
  });
</script>

<main class="flex justify-center mt-9">
  <div class="w-full md:w-3/5 lg:w-2/5 mx-5">
    <div>
      <div class="flex justify-between mb-10">
        <h1 class="text-4xl font-extrabold dark:text-white">Streaks ⚡</h1>
        <div>
          <Notification />
          <Button
            color="red"
            pill={true}
            outline={true}
            class="!p-2 ml-3"
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
