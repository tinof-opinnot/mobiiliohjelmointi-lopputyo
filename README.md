# Pony Club

Ratsastusretkien varaussovellus, Mobiiliohjelmointi-kurssin (SOF008AS3A-3020) lopputyö.

Käyttäjä selaa ratsastusretkiä (kesto, hinta, vaikeustaso), katsoo retken tiedot ja tekee varauksen valitsemalleen päivälle ja kellonajalle. Tallin ja reittien sijainnit näytetään kartalla yhdessä käyttäjän oman sijainnin kanssa. Retken tiedoissa näkyy valitun päivän sääennuste. Omat varaukset -näkymässä käyttäjä näkee tulevat varauksensa ja voi perua niitä. Sovellus ajastaa muistutusilmoituksen päivää ennen retkeä.

## Näkymät

| Näkymä | Toiminta |
| --- | --- |
| Retket | Retkilista ja suodatus vaikeustason mukaan |
| Retken tiedot | Kuvaus, reitti kartalla ja sääennuste |
| Varaa retki | Päivä, lähtöaika, henkilömäärä ja nimi |
| Kartta | Talli, reittien lähtöpisteet ja oma sijainti |
| Omat varaukset | Tulevat varaukset ja niiden peruminen |

## Tekniikat

React Native ja Expo, React Navigation (bottom tabs + native stack), React Native Paper, Firebase Realtime Database ja Firebase Authentication, react-native-maps ja expo-location, Open-Meteo- ja OSRM-rajapinnat, expo-notifications, expo-calendar, expo-haptics ja react-native-calendars.

## Firebase-asetukset

Sovellus käyttää Firebase Realtime Databasea ja anonyymiä kirjautumista (Firebase Authentication). Asetukset luetaan ympäristömuuttujista tiedostosta `.env.local`, jota ei viedä versionhallintaan:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_DATABASE_URL=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Tietokannassa on kolme osaa:

| Polku | Sisältö |
| --- | --- |
| `rides/{rideId}` | Retket (nimi, kuvaus, kesto, hinta, taso, kapasiteetti, lähtöajat, lähtöpaikka ja reitti). Syötetään Firebase-konsolista. |
| `slots/{rideId}/{päivä}/{aika}` | Lähdön varattujen paikkojen määrä |
| `bookings/{bookingId}` | Varaukset (käyttäjä, retki, päivä, aika, henkilömäärä, nimi) |

Varaus ja lähdön paikkamäärä päivitetään yhdellä atomisella kirjoituksella. Tietokannan säännöt tarkistavat, ettei lähdön kapasiteetti ylity, että varauksen kentät ovat oikeanmuotoisia ja että käyttäjä näkee ja voi perua vain omat varauksensa. Varausta ei voi muokata, vain perua.

Rajoitus: säännöillä ei voi täysin sitoa paikkalaskurin muutosta samassa kirjoituksessa tehtyyn varaukseen, joten kirjautunut käyttäjä voisi muuttaa laskuria suoraan välillä 0 ja kapasiteetti. Ilman palvelinpuolen koodia tämä on hyväksyttävä rajoitus.

Säännöt (`database.rules.json`):

```json
{
  "rules": {
    "rides": {
      ".read": true,
      ".write": false
    },
    "slots": {
      ".read": "auth != null",
      "$rideId": {
        "$date": {
          "$time": {
            ".write": "auth != null",
            ".validate": "newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && ((data.exists() && newData.val() <= data.val()) || (root.child('rides/' + $rideId).exists() && newData.val() <= root.child('rides/' + $rideId + '/capacity').val()))"
          }
        }
      }
    },
    "bookings": {
      ".indexOn": ["userId"],
      ".read": "auth != null && query.orderByChild == 'userId' && query.equalTo == auth.uid",
      "$bookingId": {
        ".read": "auth != null && (!data.exists() || data.child('userId').val() === auth.uid)",
        ".write": "auth != null && (data.exists() ? (data.child('userId').val() === auth.uid && !newData.exists()) : newData.child('userId').val() === auth.uid)",
        ".validate": "newData.hasChildren(['userId', 'rideId', 'rideName', 'date', 'time', 'persons', 'customerName', 'createdAt'])",
        "userId": { ".validate": "newData.val() === auth.uid" },
        "rideId": { ".validate": "newData.isString() && root.child('rides/' + newData.val()).exists()" },
        "rideName": { ".validate": "newData.isString() && newData.val().length <= 100" },
        "date": { ".validate": "newData.isString() && newData.val().matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)" },
        "time": { ".validate": "newData.isString() && newData.val().matches(/^[0-9]{2}:[0-9]{2}$/)" },
        "persons": { ".validate": "newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 1 && newData.val() <= 6" },
        "customerName": { ".validate": "newData.isString() && newData.val().length >= 2 && newData.val().length <= 80" },
        "durationMin": { ".validate": "newData.isNumber() && newData.val() > 0" },
        "totalEur": { ".validate": "newData.isNumber() && newData.val() >= 0" },
        "notificationId": { ".validate": "newData.isString()" },
        "createdAt": { ".validate": "newData.val() === now" },
        "$other": { ".validate": false }
      }
    }
  }
}
```
