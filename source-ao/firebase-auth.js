import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js';

const firebaseConfig = Object.freeze({
  apiKey: 'AIzaSyBPsoIQzCarYCMnpouCMKJcJDWsfqSBxXI',
  authDomain: 'hmatias-c660a.firebaseapp.com',
  projectId: 'hmatias-c660a',
  storageBucket: 'hmatias-c660a.firebasestorage.app',
  messagingSenderId: '865045791253',
  appId: '1:865045791253:web:90cfa05e71083f09f7041c',
  measurementId: 'G-HEJ7HR7E0F',
});

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

const apiBase = () => String(window.SOURCE_AO_RUNTIME?.apiBase || '').replace(/\/$/, '');

async function readyUser() {
  if (auth.currentUser) return auth.currentUser;
  return new Promise(resolve => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function getIdToken(user = null) {
  const current = user || await readyUser();
  if (!current) return null;
  return current.getIdToken();
}

export async function syncApiSession(user = null) {
  const current = user || await readyUser();
  if (!current) return null;
  const base = apiBase();
  if (!/^https:\/\//i.test(base)) throw new Error('A API SOURCE AO não está configurada.');
  const token = await getIdToken(current);
  const response = await fetch(base + '/api/auth/session', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: 'Bearer ' + token,
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok !== true || !payload?.identity) {
    throw new Error(payload?.error?.message || 'Não foi possível sincronizar a sessão SOURCE AO.');
  }
  return payload.identity;
}

export async function createAccount(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const cleanName = String(displayName || '').trim().slice(0, 120);
  if (cleanName) await updateProfile(credential.user, { displayName: cleanName });
  await sendEmailVerification(credential.user);
  return credential.user;
}

export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function signOutAccount() {
  return signOut(auth);
}

export { onAuthStateChanged };
window.SourceAOAuth = Object.freeze({
  getIdToken,
  syncApiSession,
  getAuthorizationHeader: async () => {
    const token = await getIdToken();
    return token ? 'Bearer ' + token : null;
  },
  onAuthStateChanged: callback => onAuthStateChanged(auth, callback),
});
