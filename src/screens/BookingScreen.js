import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function BookingScreen({ route }) {
  const { ride } = route.params;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Varauslomake: {ride.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
