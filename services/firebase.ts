import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhXtUNkmCMzcjUlsaYSZ_NVCTHiVcovMA",
  authDomain: "kanacreator-af97d.firebaseapp.com",
  projectId: "kanacreator-af97d",
  storageBucket: "kanacreator-af97d.firebasestorage.app",
  messagingSenderId: "223514917934",
  appId: "1:223514917934:web:b03c3b39d809366469f3bf",
  measurementId: "G-90VEV3KWKN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { auth, app, analytics };
