// App.tsx
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Globe from "./Components/Globe"; 
import SidePanel from "./Components/SidePanel";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <SidePanel estimatedMass={1} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});