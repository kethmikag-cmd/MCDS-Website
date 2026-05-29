// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC4T3nOzsz09K7VEECwlMFd9g9UKhhT_aY",
    authDomain: "mcdssc-bc377.firebaseapp.com",
    databaseURL: "https://mcdssc-bc377-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mcdssc-bc377",
    storageBucket: "mcdssc-bc377.firebasestorage.app",
    messagingSenderId: "1065558724848",
    appId: "1:1065558724848:web:111d1f579401d85aeaf235",
    measurementId: "G-TKSRSF327C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

// You can export the instances if you want to use them in another module script
export { app, analytics, database };
