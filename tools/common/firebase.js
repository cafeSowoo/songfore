import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  GoogleAuthProvider,
  getAuth,
  browserLocalPersistence,
  inMemoryPersistence,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  doc,
  getDoc,
  getFirestore
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const fallbackConfig = {
  apiKey: "REPLACE_WITH_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_FIREBASE_PROJECT_ID",
  storageBucket: "REPLACE_WITH_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_FIREBASE_APP_ID",
  measurementId: "REPLACE_WITH_FIREBASE_MEASUREMENT_ID"
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
  try {
    try {
      await setPersistence(auth, browserLocalPersistence);
      return;
    } catch (localError) {
      console.warn('Firebase auth persistence browserLocalPersistence ?ㅼ젙 ?ㅽ뙣. inMemoryPersistence濡??대갚?⑸땲??', localError);
      await setPersistence(auth, inMemoryPersistence);
    }
  } catch (error) {
    console.warn('Firebase auth persistence ?ㅼ젙 ?ㅽ뙣, 湲곕낯 ?숈옉?쇰줈 吏꾪뻾?⑸땲??', error);
  }
}

export async function loginWithGoogle() {
  if (!hasConfig) {
    throw new Error('Firebase config is not configured');
  }
  const isEdge = typeof navigator !== 'undefined' && /Edg\//i.test(navigator.userAgent || '');
  if (isEdge) {
    return signInWithRedirect(auth, provider);
  }
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    const fallbackCodes = new Set([
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment'
    ]);

    const isFallbackCase = fallbackCodes.has(error.code) ||
      (error.message || '').includes('window.closed') ||
      (error.message || '').includes('Cross-Origin-Opener-Policy') ||
      (error.message || '').includes('window.close');

    if (isFallbackCase) {
      return signInWithRedirect(auth, provider);
    }

    throw error;
  }
}

export async function handleRedirectLogin() {
  if (!hasConfig) {
    return null;
  }

  try {
    return await getRedirectResult(auth);
  } catch (error) {
    console.warn('Firebase 由щ뵒?됲듃 濡쒓렇??泥섎━ ?ㅽ뙣:', error);
    return null;
  }
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

  try {
    const ref = doc(db, 'roles', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const role = snap.get('role');
    return normalizeRole(role);
  } catch (error) {
    console.warn('??븷 議고쉶 以??ㅻ쪟 諛쒖깮:', error);
    return null;
  }
}

export function isMaster(role) {
  return role === ROLE.MASTER;
}

export function isManager(role) {
  return role === ROLE.MASTER || role === ROLE.ADMIN;
}

export async function getCurrentUserRole(user = auth.currentUser) {
  try {
    if (!user) return ROLE.NONE;
    const role = await loadUserRole(user.uid);
    return normalizeRole(role);
  } catch (error) {
    console.warn('?꾩옱 ?ъ슜????븷 議고쉶 ?ㅽ뙣:', error);
    return ROLE.NONE;
  }
}

