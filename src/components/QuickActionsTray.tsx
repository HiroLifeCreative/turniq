/** Bandeja de acciones rápidas (Semana): botón flotante + que abre
 *  la Sheet propia con las acciones.
 *
 *  NOTA (24 oct 2026): la primera versión usaba morphlet (el botón se
 *  transformaba en bandeja nativa), pero el bundle de Android FALLÓ
 *  por eso: la spec de código de morphlet usa patrones que el codegen
 *  de React Native 0.76 no entiende ("Unknown prop type" en
 *  MorphletHostViewNativeComponent: WithDefault con boolean crudo y
 *  objetos anidados). Se retiró la librería; la Sheet propia da las
 *  mismas tres acciones sin código nativo nuevo. */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon, Sheet, useTheme, useT } from './ui';
import { SP, FONT, TYPE, ICON } from '../theme/tokens';

export interface QuickActions {
  onNewShift: () => void;
  onDuplicateWeek: () => void;
  onOpenTemplates: () => void;
}

export function QuickActionsTray({ onNewShift, onDuplicateWeek, onOpenTemplates }: QuickActions) {
  const t = useT();
  const p = useTheme();
  const [open, setOpen] = React.useState(false);

  const Row = ({ icon, label, fn }: { icon: string; label: string; fn: () => void }) => (
    <TouchableOpacity
      onPress={() => {
        setOpen(false);
        fn();
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

  return (
    <>
      <View style={{ position: 'absolute', right: SP.lg, bottom: 116, zIndex: 60 }}>
        <TouchableOpacity
          onPress={() => setOpen(true)}
          activeOpacity={0.85}
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
        </TouchableOpacity>
      </View>
      <Sheet visible={open} onClose={() => setOpen(false)} title={t.semana.quickActions}>
        <Row icon="plus" label={t.today.addShift} fn={onNewShift} />
        <Row icon="copy" label={t.week.duplicate} fn={onDuplicateWeek} />
        <Row icon="fileText" label={t.more.templates} fn={onOpenTemplates} />
      </Sheet>
    </>
  );
}
