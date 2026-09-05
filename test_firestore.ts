import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC3KTsQ8iYAzsreDBzT87ntHngqd_ym0zk",
  authDomain: "spot-8f2f3.firebaseapp.com",
  projectId: "spot-8f2f3",
  storageBucket: "spot-8f2f3.firebasestorage.app",
  messagingSenderId: "902178765612",
  appId: "1:902178765612:web:0c8dcc5168b20b9e030a89"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runTest() {
  try {
    console.log("Signing in anonymously...");
    const userCred = await signInAnonymously(auth);
    console.log("Signed in. UID:", userCred.user.uid);

    console.log("Querying parkingSessions globally...");
    const q = query(
      collection(db, 'parkingSessions'),
      where('status', 'in', ['active', 'just_left'])
    );
    
    const snapshot = await getDocs(q);
    console.log(`Received ${snapshot.docs.length} documents.`);
    
    snapshot.forEach(doc => {
      console.log(`\n--- Doc ID: ${doc.id} ---`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
    
    process.exit(0);
  } catch (error) {
    console.error("Error during test:", error);
    process.exit(1);
  }
}

runTest();
