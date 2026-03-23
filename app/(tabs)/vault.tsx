import { View, Text, StyleSheet } from "react-native";

export default function VaultScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Vault Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  text: {
    color: "#f9fafb",
    fontSize: 18,
  },
});
