import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBhLIxNbTAeuZx0EtP1W83NLQEx8oRT8Bc",
  authDomain: "inventory-17799.firebaseapp.com",
  projectId: "inventory-17799",
  storageBucket: "inventory-17799.appspot.com",
  messagingSenderId: "990518663070",
  appId: "1:990518663070:web:c0ae08b8cdd9acb7eda88f",
  measurementId: "G-BPFBSQCTEX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
