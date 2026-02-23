import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjqcam5YK1pariUOXGKLA396frJTl_8XI",
  authDomain: "canteen-app-255e4.firebaseapp.com",
  projectId: "canteen-app-255e4",
  storageBucket: "canteen-app-255e4.firebasestorage.app",
  messagingSenderId: "685386614870",
  appId: "1:685386614870:web:24487ac7020da5245393f7",
  measurementId: "G-91WNV3PYWN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Collection name constant
export const MENU_ITEMS_COLLECTION = "menu_items";
