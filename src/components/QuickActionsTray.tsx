/** Bandeja flotante de acciones rápidas (Semana): el botón + se
 *  TRANSFORMA en la bandeja usando morphlet (nativo, New Arch).
 *  En web hay un fallback con la Sheet propia (QuickActionsTray.web). */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Tray, useTray } from 'morphlet';
import { Icon, useTheme, useT } from './ui';
import { SP, FONT, TYPE, ICON } from '../theme/tokens';

export interface QuickActions {
  onNewShift: () => void;
  onDuplicateWeek: () => void;
  onOpenTemplates: () => void;
}

function Row({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const p = useTheme();
  const { close } = useTray();
  return (
    <TouchableOpacity
      onPress={() => {
        close();
        onPress();
      }}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 4 }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: 'rgba(3,146,255,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SP.md,
        }}
      >
        <Icon name={icon} size={ICON.md} color="#0392FF" />
      </View>
      <Text style={{ fontFamily: FONT.head, fontWeight: '600', fontSize: TYPE.body, color: p.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function QuickActionsTray({ onNewShift, onDuplicateWeek, onOpenTemplates }: QuickActions) {
  const t = useT();
  const p = useTheme();
  return (
    <View style={{ position: 'absolute', right: SP.lg, bottom: 116, zIndex: 60, alignItems: 'flex-end' }}>
      <Tray.Root>
        <Tray.Trigger morph>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#0392FF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#0392FF',
              shadowOpacity: 0.4,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            <Icon name="plus" size={26} color="#C4E9FF" />
          </View>
        </Tray.Trigger>
        <Tray.Content backgroundColor={p.card} cornerRadius={24}>
          <Tray.Body>
            <View style={{ padding: SP.md, minWidth: 272 }}>
              <Text
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  color: p.text3,
                  marginBottom: SP.sm,
                  marginLeft: 4,
                }}
              >
                {t.semana.quickActions}
              </Text>
              <Row icon="plus" label={t.today.addShift} onPress={onNewShift} />
              <Row icon="copy" label={t.week.duplicate} onPress={onDuplicateWeek} />
              <Row icon="fileText" label={t.more.templates} onPress={onOpenTemplates} />
            </View>
          </Tray.Body>
        </Tray.Content>
      </Tray.Root>
    </View>
  );
}
