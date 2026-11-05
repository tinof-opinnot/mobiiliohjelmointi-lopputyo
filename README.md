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
