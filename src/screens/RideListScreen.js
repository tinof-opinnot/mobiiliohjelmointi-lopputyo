import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

export default function RideListScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Retkilista</Text>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate('RideDetail', { ride: { name: 'Esimerkkiretki' } })}
      >
        Retken tiedot
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
