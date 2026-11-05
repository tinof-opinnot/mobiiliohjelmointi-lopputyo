import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Kartta</Text>
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
