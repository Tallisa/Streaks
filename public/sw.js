import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { NavigationRoute, registerRoute } from 'workbox-routing';

import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST);

// clean old assets
cleanupOutdatedCaches();

let allowlist;
if (import.meta.env.DEV) {
  allowlist = [/^\/$/];
}

// to allow work offline
registerRoute(new NavigationRoute(
  createHandlerBoundToURL('index.html'),
  { allowlist },
));

const firebaseApp = initializeApp({
  apiKey: "AIzaSyA_kmqnm9ZEcqiMrZjVHeHmgQ0OkqYHIe0",
  authDomain: "todo-streaks.firebaseapp.com",
  projectId: "todo-streaks",
  storageBucket: "todo-streaks.appspot.com",
  messagingSenderId: "963730327060",
  appId: "1:963730327060:web:c289cae62d46dc3f3e4901",
  measurementId: "G-J2KCT4CBKM"
});

const messaging = getMessaging(firebaseApp);

self.skipWaiting();
clientsClaim();