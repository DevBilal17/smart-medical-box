import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { ActivityIndicator, View } from "react-native";

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

 
  // if (!isAuthenticated) {
  //   return <Redirect href="/(auth)/login" />;
  // }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(patient)" options={{ headerShown: false }} />
      <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
    </Stack>
  );
}