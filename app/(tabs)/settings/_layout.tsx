import { useI18n } from "@/lib/i18n";
import { Stack } from "expo-router";

export default function SettingsLayout() {
  const { t } = useI18n();
  return (
    <Stack
      screenOptions={{
        ...(process.env.EXPO_OS !== "ios"
          ? {}
          : {
              headerLargeTitle: true,
              headerLargeTitleShadowVisible: false,
              headerShadowVisible: true,
            }),
      }}
    >
      <Stack.Screen name="index" options={{ title: t("nav.settings") }} />
    </Stack>
  );
}
