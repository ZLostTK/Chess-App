import { useI18n } from "@/lib/i18n";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

/**
 * Native bottom tabs — wraps the actual UITabBarController on iOS, so
 * on iOS 26 the tab bar is automatic Liquid Glass with no
 * tabBarBackground / tint / borderTopWidth workarounds. On older iOS
 * it falls back to the system frosted material. On Android it uses
 * the platform-native bottom navigation.
 *
 * The previous React Navigation Tabs + BlurView approach was iOS-7-era
 * frosted material, which is the closest you can get without going
 * native — but the user wanted real Liquid Glass, which only the
 * actual UITabBarController provides.
 *
 * Each Trigger's `name` matches a directory under (tabs)/, and that
 * directory's _layout.tsx still owns its own Stack with the iOS
 * large-title chrome — NativeTabs only owns the bar, not the screens.
 */
export default function TabLayout() {
  const { t } = useI18n();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="play">
        <Icon sf="gamecontroller.fill" />
        <Label>{t("nav.play")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="smoke">
        <Icon sf="flame.fill" />
        <Label>{t("nav.smoke")}</Label>
      </NativeTabs.Trigger>

      {/* @ts-expect-error unstable-native-tabs types are missing Slot */}
      <NativeTabs.Slot name="play" />
      {/* @ts-expect-error unstable-native-tabs types are missing Slot */}
      <NativeTabs.Slot name="smoke" />
    </NativeTabs>
  );
}
