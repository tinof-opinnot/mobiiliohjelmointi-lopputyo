import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import {
  equalTo,
  get,
  getDatabase,
  increment,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  serverTimestamp,
  update,
} from 'firebase/database';

// Asetukset tulevat tiedostosta .env.local, joka ei ole versionhallinnassa
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let database = null;
let auth = null;
if (firebaseConfig.databaseURL && firebaseConfig.apiKey) {
  const app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  // Kirjautuminen säilyy sovelluksen uudelleenkäynnistyksen yli
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

export class FullError extends Error {}

const notConfigured = () => new Error('Firebase-asetukset puuttuvat.');

// Anonyymi kirjautuminen: jokaisella laitteella on oma käyttäjätunnus,
// jonka avulla "Omat varaukset" näyttää vain omat varaukset.
let userIdPromise = null;
export function getUserId() {
  if (!auth) return Promise.reject(notConfigured());
  if (!userIdPromise) {
    userIdPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          if (user) resolve(user.uid);
          else signInAnonymously(auth).then((cred) => resolve(cred.user.uid), reject);
        },
        reject
      );
    }).catch((error) => {
      userIdPromise = null;
      throw error;
    });
  }
  return userIdPromise;
}

// Muuttaa Firebasen objektin { id: {...} } listaksi [{ id, ... }]
function toList(snapshot) {
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data).map(([id, value]) => ({ id, ...value }));
}

// Kuuntelee tietokantaa. Palauttaa funktion, joka lopettaa kuuntelun.
function listen(getRef, mapSnapshot, onData, onError, needsUser = false) {
  if (!database) {
    onError(notConfigured());
    return () => {};
  }
  let unsubscribe = null;
  let stopped = false;
  const start = (userId) => {
    if (stopped) return;
    unsubscribe = onValue(getRef(userId), (snapshot) => onData(mapSnapshot(snapshot)), onError);
  };
  if (needsUser) getUserId().then(start).catch(onError);
  else start();
  return () => {
    stopped = true;
    if (unsubscribe) unsubscribe();
  };
}

export function listenRides(onData, onError) {
  return listen(() => ref(database, 'rides'), toList, onData, onError);
}

// Varatut paikat retken lähdöittäin: { "2026-11-20": { "10:00": 4 } }
export function listenSlots(rideId, onData, onError) {
  return listen(
    () => ref(database, `slots/${rideId}`),
    (snapshot) => snapshot.val() ?? {},
    onData,
    onError,
    true
  );
}

export function listenMyBookings(onData, onError) {
  return listen(
    (userId) => query(ref(database, 'bookings'), orderByChild('userId'), equalTo(userId)),
    toList,
    onData,
    onError,
    true
  );
}

const slotPath = ({ rideId, date, time }) => `slots/${rideId}/${date}/${time}`;
const isPermissionDenied = (error) => String(error?.code ?? error?.message).toLowerCase().includes('permission');

// Varaus ja lähdön paikkalaskuri päivitetään yhdellä atomisella kirjoituksella:
// joko molemmat onnistuvat tai kumpikaan ei. Tietokannan säännöt tarkistavat,
// ettei laskuri ylitä lähdön kapasiteettia, joten samanaikaiset varaukset
// eivät voi ylibuukata lähtöä.
export async function createBooking(booking) {
  if (!database) throw notConfigured();
  const userId = await getUserId();
  const key = push(ref(database, 'bookings')).key;

  // Firebase ei hyväksy undefined-arvoja, joten tyhjät kentät jätetään pois
  const fields = Object.fromEntries(Object.entries(booking).filter(([, value]) => value != null));

  try {
    await update(ref(database), {
      [`bookings/${key}`]: { ...fields, userId, createdAt: serverTimestamp() },
      [slotPath(booking)]: increment(booking.persons),
    });
  } catch (error) {
    // Säännöt palauttavat saman virheen kaikista hylkäyksistä, joten
    // tarkistetaan, oliko syy todella täysi lähtö
    if (isPermissionDenied(error) && (await isSlotFull(booking))) {
      throw new FullError('Lähdössä ei ole enää tarpeeksi vapaita paikkoja.');
    }
    throw error;
  }
  return key;
}

async function isSlotFull(booking) {
  try {
    const [booked, capacity] = await Promise.all([
      get(ref(database, slotPath(booking))),
      get(ref(database, `rides/${booking.rideId}/capacity`)),
    ]);
    return (booked.val() ?? 0) + booking.persons > (capacity.val() ?? 0);
  } catch {
    return false;
  }
}

// Peruminen poistaa varauksen ja vapauttaa paikat samalla kirjoituksella.
// Tiedot luetaan tietokannasta, ja jo peruttu varaus ohitetaan, joten
// kaksinkertainen peruminen ei vapauta paikkoja kahdesti.
export async function cancelBooking(booking) {
  if (!database) throw notConfigured();
  await getUserId();
  const bookingRef = ref(database, `bookings/${booking.id}`);

  const snapshot = await get(bookingRef);
  if (!snapshot.exists()) return;
  const stored = snapshot.val();

  try {
    await update(ref(database), {
      [`bookings/${booking.id}`]: null,
      [slotPath(stored)]: increment(-stored.persons),
    });
  } catch (error) {
    // Jos toinen peruutus ehti ensin, säännöt hylkäävät tämän kirjoituksen
    const again = await get(bookingRef);
    if (!again.exists()) return;
    throw error;
  }
}
