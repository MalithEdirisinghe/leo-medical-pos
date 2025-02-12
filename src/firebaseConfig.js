import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDT6vazqEgJfZjh8X8br-HQda1X0nAY4b8",
    authDomain: "leo-medical-pos.firebaseapp.com",
    projectId: "leo-medical-pos",
    storageBucket: "leo-medical-pos.firebasestorage.app",
    messagingSenderId: "113855607873",
    appId: "1:113855607873:web:cdce87ede4188ab04ec2c0",
    measurementId: "G-47SXZ0RQ4F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export Firestore methods
export { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, writeBatch };
