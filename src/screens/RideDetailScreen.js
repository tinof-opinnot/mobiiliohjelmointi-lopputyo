import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

export default function RideDetailScreen({ navigation, route }) {
  const { ride } = route.params;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">{ride.name}</Text>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate('Booking', { ride })}
      >
        Varaa retki
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 16,
  },
});
