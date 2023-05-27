// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_kmqnm9ZEcqiMrZjVHeHmgQ0OkqYHIe0",
  authDomain: "todo-streaks.firebaseapp.com",
  projectId: "todo-streaks",
  storageBucket: "todo-streaks.appspot.com",
  messagingSenderId: "963730327060",
  appId: "1:963730327060:web:c289cae62d46dc3f3e4901",
  measurementId: "G-J2KCT4CBKM"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
 