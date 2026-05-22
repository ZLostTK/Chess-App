import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  useColorScheme,
  GestureResponderEvent,
} from "react-native";
import { BodyScrollView } from "@/components/body-scroll-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const { t, lang, setLang } = useI18n();
  const settings = useSettings();

  const textColor = useThemeColor({}, "text");
  const subText = useThemeColor({}, "icon");
  const bg = dark ? "#0d0d0d" : "#f4f6fa";
  const cardBg = dark ? "#1a1a1a" : "#ffffff";
  const accent = "#0a7ea4";

  const [helpModal, setHelpModal] = useState<{ title: string; desc: string } | null>(null);

  const openHelp = (titleKey: any, descKey: any) => {
    setHelpModal({ title: t(titleKey), desc: t(descKey) });
  };

  const HelpIcon = ({ titleKey, descKey }: { titleKey: any; descKey: any }) => (
    <Pressable
      onPress={() => openHelp(titleKey, descKey)}
      style={({ pressed }) => [styles.helpBtn, pressed && { opacity: 0.6 }]}
    >
      <Text style={[styles.helpText, { color: subText }]}>?</Text>
    </Pressable>
  );

  return (
    <BodyScrollView contentContainerStyle={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.heading, { color: textColor }]}>{t("settings.title")}</Text>

      {/* Language */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <View style={styles.rowTitle}>
          <Text style={[styles.cardTitle, { color: textColor }]}>{t("settings.lang")}</Text>
          <HelpIcon titleKey="settings.lang" descKey="settings.lang.desc" />
        </View>
        <View style={styles.segmentRow}>
          <SegmentBtn
            active={lang === "es"}
            label="Español (ES)"
            onPress={() => setLang("es")}
            accent={accent}
          />
          <SegmentBtn
            active={lang === "en"}
            label="English (EN)"
            onPress={() => setLang("en")}
            accent={accent}
          />
        </View>
      </View>

      {/* Skill Level */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <View style={styles.rowTitle}>
          <Text style={[styles.cardTitle, { color: textColor }]}>{t("settings.skillLevel")}</Text>
          <HelpIcon titleKey="settings.skillLevel" descKey="settings.skillLevel.desc" />
        </View>
        <Text style={[styles.skillValue, { color: accent }]}>{settings.skillLevel}</Text>
        <SkillSlider
          value={settings.skillLevel}
          onChange={settings.setSkillLevel}
          accent={accent}
          dark={dark}
        />
      </View>

      {/* Theme */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <View style={styles.rowTitle}>
          <Text style={[styles.cardTitle, { color: textColor }]}>{t("settings.theme")}</Text>
          <HelpIcon titleKey="settings.theme" descKey="settings.theme.desc" />
        </View>
        <View style={styles.themeRow}>
          <ThemePreview
            active={settings.theme === "BLUE"}
            name="BLUE"
            colors={["#dee3e6", "#8ca2ad"]}
            onPress={() => settings.setTheme("BLUE")}
            accent={accent}
            dark={dark}
          />
          <ThemePreview
            active={settings.theme === "GREEN"}
            name="GREEN"
            colors={["#eeeed2", "#769656"]}
            onPress={() => settings.setTheme("GREEN")}
            accent={accent}
            dark={dark}
          />
          <ThemePreview
            active={settings.theme === "WOOD"}
            name="WOOD"
            colors={["#f0d9b5", "#b58863"]}
            onPress={() => settings.setTheme("WOOD")}
            accent={accent}
            dark={dark}
          />
        </View>
      </View>

      {/* Pieces Format */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <View style={styles.rowTitle}>
          <Text style={[styles.cardTitle, { color: textColor }]}>{t("settings.piecesFormat")}</Text>
          <HelpIcon titleKey="settings.piecesFormat" descKey="settings.piecesFormat.desc" />
        </View>
        <View style={styles.segmentRow}>
          <SegmentBtn
            active={settings.piecesFormat === "PNG"}
            label="PNG"
            onPress={() => settings.setPiecesFormat("PNG")}
            accent={accent}
          />
          <SegmentBtn
            active={settings.piecesFormat === "UNICODE"}
            label="Unicode ♘"
            onPress={() => settings.setPiecesFormat("UNICODE")}
            accent={accent}
          />
        </View>
      </View>

      {/* Switches */}
      <View style={[styles.card, { backgroundColor: cardBg, paddingVertical: 8 }]}>
        <SwitchRow
          title={t("settings.autoflip")}
          helpKey="settings.autoflip.desc"
          value={settings.autoflip}
          onValueChange={settings.setAutoflip}
          openHelp={openHelp}
        />
        <View style={[styles.divider, { backgroundColor: dark ? "#333" : "#eee" }]} />
        <SwitchRow
          title={t("settings.showCoordinates")}
          helpKey="settings.showCoordinates.desc"
          value={settings.showCoordinates}
          onValueChange={settings.setShowCoordinates}
          openHelp={openHelp}
        />
        <View style={[styles.divider, { backgroundColor: dark ? "#333" : "#eee" }]} />
        <SwitchRow
          title={t("settings.sounds")}
          helpKey="settings.sounds.desc"
          value={settings.sounds}
          onValueChange={settings.setSounds}
          openHelp={openHelp}
        />
        <View style={[styles.divider, { backgroundColor: dark ? "#333" : "#eee" }]} />
        <SwitchRow
          title={t("settings.premoves")}
          helpKey="settings.premoves.desc"
          value={settings.premoves}
          onValueChange={settings.setPremoves}
          openHelp={openHelp}
        />
      </View>

      {/* Help Modal */}
      <Modal
        visible={helpModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {helpModal?.title}
            </Text>
            <Text style={[styles.modalDesc, { color: subText }]}>
              {helpModal?.desc}
            </Text>
            <Pressable
              onPress={() => setHelpModal(null)}
              style={({ pressed }) => [styles.modalBtn, { opacity: pressed ? 0.7 : 1, backgroundColor: accent }]}
            >
              <Text style={styles.modalBtnText}>{t("settings.help.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </BodyScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function SwitchRow({ title, helpKey, value, onValueChange, openHelp }: any) {
  const textColor = useThemeColor({}, "text");
  const subText = useThemeColor({}, "icon");

  return (
    <View style={styles.switchRow}>
      <View style={styles.switchTextWrap}>
        <Text style={[styles.switchTitle, { color: textColor }]}>{title}</Text>
        <Pressable
          onPress={() => openHelp(title, helpKey)}
          style={({ pressed }) => [styles.helpBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.helpText, { color: subText }]}>?</Text>
        </Pressable>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: "#0a7ea4" }} />
    </View>
  );
}

function SegmentBtn({ active, label, onPress, accent }: any) {
  const dark = useColorScheme() === "dark";
  const activeColor = active ? accent : (dark ? "#333" : "#eee");
  const textColor = active ? "#fff" : (dark ? "#aaa" : "#555");
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentBtn, { backgroundColor: activeColor }]}
    >
      <Text style={[styles.segmentText, { color: textColor, fontWeight: active ? "700" : "500" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ThemePreview({ active, name, colors, onPress, accent, dark }: any) {
  const textColor = active ? accent : (dark ? "#aaa" : "#555");
  return (
    <Pressable onPress={onPress} style={[styles.themePreviewWrap, active && { borderColor: accent }]}>
      <View style={styles.themeGrid}>
        <View style={[styles.themeBox, { backgroundColor: colors[0] }]} />
        <View style={[styles.themeBox, { backgroundColor: colors[1] }]} />
        <View style={[styles.themeBox, { backgroundColor: colors[1] }]} />
        <View style={[styles.themeBox, { backgroundColor: colors[0] }]} />
      </View>
      <Text style={[styles.themeLabel, { color: textColor }]}>{name}</Text>
    </Pressable>
  );
}

function SkillSlider({ value, onChange, accent, dark }: any) {
  const [width, setWidth] = useState(0);

  const handleTouch = (e: GestureResponderEvent) => {
    if (width === 0) return;
    const x = e.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, x / width));
    const level = Math.round(pct * 20);
    onChange(level);
  };

  const pct = value / 20;

  return (
    <View
      style={styles.sliderWrap}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
    >
      <View pointerEvents="none" style={[styles.sliderTrack, { backgroundColor: dark ? "#333" : "#ddd" }]}>
        <View style={[styles.sliderFill, { width: `${pct * 100}%`, backgroundColor: accent }]} />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.sliderThumb,
          {
            left: `${pct * 100}%`,
            backgroundColor: dark ? "#fff" : "#fff",
            borderColor: accent,
          }
        ]}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
    minHeight: "100%",
    gap: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  rowTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  helpBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#aaa",
    alignItems: "center",
    justifyContent: "center",
  },
  helpText: {
    fontSize: 14,
    fontWeight: "700",
  },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 14,
  },
  skillValue: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 4,
  },
  sliderWrap: {
    height: 44,
    justifyContent: "center",
  },
  sliderTrack: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
  },
  sliderThumb: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    marginLeft: -14, // Center thumb
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  themeRow: {
    flexDirection: "row",
    gap: 12,
  },
  themePreviewWrap: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 12,
    gap: 8,
  },
  themeGrid: {
    width: 48,
    height: 48,
    flexWrap: "wrap",
    flexDirection: "row",
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#00000030",
  },
  themeBox: {
    width: 24,
    height: 24,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  switchTextWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  modalBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
