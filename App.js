import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationTheme, theme } from './src/theme';
import RideListScreen from './src/screens/RideListScreen';
import RideDetailScreen from './src/screens/RideDetailScreen';
import BookingScreen from './src/screens/BookingScreen';
import MapScreen from './src/screens/MapScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Retket-välilehden sisällä on pino: lista -> tiedot -> varaus
function RidesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: theme.colors.primary }}>
      <Stack.Screen name="RideList" component={RideListScreen} options={{ title: 'Retket' }} />
      <Stack.Screen
        name="RideDetail"
        component={RideDetailScreen}
        options={({ route }) => ({ title: route.params?.ride?.name ?? 'Retken tiedot' })}
      />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Varaa retki' }} />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  RidesTab: 'horse-variant',
  Map: 'map-marker-radius',
  MyBookings: 'calendar-check',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer theme={navigationTheme}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: theme.colors.outline,
              headerTintColor: theme.colors.primary,
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name={TAB_ICONS[route.name]} color={color} size={size} />
              ),
            })}
          >
            <Tab.Screen
              name="RidesTab"
              component={RidesStack}
              options={{ title: 'Retket', headerShown: false }}
            />
            <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Kartta' }} />
            <Tab.Screen
              name="MyBookings"
              component={MyBookingsScreen}
              options={{ title: 'Omat varaukset' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
        <StatusBar style="dark" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
