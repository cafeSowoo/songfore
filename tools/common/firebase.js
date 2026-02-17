import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  GoogleAuthProvider,
  browserSessionPersistence,
  getAuth,
  setPersistence,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  doc,
  getDoc,
  getFirestore
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const fallbackConfig = {
  apiKey: "AIzaSyCo4VM9wfhQ1IK2fmm7nprN5Dp47IRCORE",
  authDomain: "songfore-master.firebaseapp.com",
  projectId: "songfore-master",
  storageBucket: "songfore-master.firebasestorage.app",
  messagingSenderId: "881807170656",
  appId: "1:881807170656:web:4432db49a384d294557705",
  measurementId: "G-FQS2ZQYZ3C"
};

const userConfig = window.__songforest_firebase_config__;
const firebaseConfig = userConfig || fallbackConfig;

const hasConfig = !/REPLACE_WITH_/.test(`${firebaseConfig.apiKey}${firebaseConfig.authDomain}${firebaseConfig.projectId}`);

if (!hasConfig) {
  console.warn(
    'Firebase config is not set yet. Please replace placeholders in tools/common/firebase.js with values from Firebase console.'
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export const ROLE = {
  MASTER: 'master',
  ADMIN: 'admin',
  NONE: 'none'
};

export async function initAuthSession() {
  await setPersistence(auth, browserSessionPersistence);
}

export async function loginWithGoogle() {
  if (!hasConfig) {
    throw new Error('Firebase config is not configured');
  }
  return signInWithPopup(auth, provider);
}

export async function logout() {
  return signOut(auth);
}

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

function normalizeRole(role) {
  if (typeof role !== 'string') return ROLE.NONE;
  const normalized = role.trim().toLowerCase();
  if (normalized === ROLE.MASTER || normalized === ROLE.ADMIN) return normalized;
  return ROLE.NONE;
}

export async function loadUserRole(uid) {
  if (!uid) return null;
  if (!hasConfig) return null;

  const ref = doc(db, 'roles', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const role = snap.get('role');
  return normalizeRole(role);
}

export function isMaster(role) {
  return role === ROLE.MASTER;
}

export function isManager(role) {
  return role === ROLE.MASTER || role === ROLE.ADMIN;
}

export async function getCurrentUserRole() {
  const user = auth.currentUser;
  if (!user) return ROLE.NONE;
  const role = await loadUserRole(user.uid);
  return normalizeRole(role);
}
