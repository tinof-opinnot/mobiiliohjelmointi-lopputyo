// Varauksen lisääminen puhelimen kalenteriin. Käyttöjärjestelmän oma
// tapahtumanäkymä aukeaa, joten käyttäjä voi vielä muokata tai perua.
// Uusi oliopohjainen API ei toimi Expo Go:ssa, siksi legacy-rajapinta.
import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';
import { STABLE } from '../constants';
import { toDateTime } from '../format';

// Palauttaa true vain, kun tiedetään tapahtuman tallentuneen (iOS).
// Androidin kalenteri ei kerro, tallennettiinko tapahtuma, joten siellä false.
export async function addToCalendar({ rideName, date, time, durationMin, persons }) {
  // iOS 16 vaatii kalenteriluvan ennen tapahtumanäkymää, iOS 17 ja uudemmat eivät
  if (Platform.OS === 'ios' && parseInt(Platform.Version, 10) < 17) {
    const { granted } = await Calendar.requestCalendarPermissionsAsync();
    if (!granted) throw new Error('Kalenterilupaa ei annettu.');
  }

  const startDate = toDateTime(date, time);
  const endDate = new Date(startDate.getTime() + (durationMin ?? 60) * 60 * 1000);

  const result = await Calendar.createEventInCalendarAsync({
    title: `Ratsastusretki: ${rideName}`,
    startDate,
    endDate,
    location: `${STABLE.name}, ${STABLE.address}`,
    notes: `Varaus ${persons} henkilölle. Saavu tallille 15 min ennen lähtöä.`,
    // Hälytys toimii iOS:ssä. Android ohittaa sen, mutta sovelluksen oma muistutus toimii molemmissa.
    alarms: [{ relativeOffset: -120 }],
  });
  return result.action === 'saved';
}
