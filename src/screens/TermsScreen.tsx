/** Términos y condiciones + política de datos locales. */
import React from 'react';
import {  View, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ContentSheet,  Screen, TopBar, useTheme, useT } from '../components/ui';
import { useStore } from '../store';
import { SP, FONT, TYPE } from '../theme/tokens';

interface Section {
  h: string;
  body: string[];
}

const CONTENT: Record<'es' | 'en', { updated: string; sections: Section[] }> = {
  es: {
    updated: 'Última actualización: 20 de octubre de 2026',
    sections: [
      {
        h: '1. Aceptación de los términos',
        body: [
          'Al descargar, instalar o utilizar Turniq aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, no utilices la aplicación.',
        ],
      },
      {
        h: '2. Tus datos son 100% locales',
        body: [
          'Turniq almacena TODA tu información únicamente en tu dispositivo: trabajos, turnos, salarios, estaciones, ajustes y copias que exportes. La aplicación no tiene servidores propios, no requiere cuenta ni registro, y no envía tu información a la nube ni a terceros.',
          'Esto significa que:',
          '• Si desinstalas la aplicación o borras sus datos, la información se pierde de forma permanente.\n• Si cambias de teléfono, debes exportar tu respaldo desde Ajustes → Datos y importarlo en el nuevo dispositivo.\n• Eres el único responsable de mantener tus propios respaldos.',
        ],
      },
      {
        h: '3. Privacidad',
        body: [
          'Turniq no recopila, no vende y no comparte datos personales. La aplicación no incluye analíticas, rastreadores ni publicidad de terceros. Las notificaciones que recibes se generan localmente en tu dispositivo.',
          'De forma opcional, puedes conectar servicios de Google (Calendario o Gmail) para sincronizar tus turnos. Esa sincronización se realiza directamente entre tu dispositivo y tu cuenta de Google, y se rige por los términos y la política de privacidad de Google. Turniq no intermedia ni conserva copia de esa información fuera de tu dispositivo.',
          'La función de bloqueo con PIN o biometría protege el acceso a la aplicación en tu dispositivo; tu PIN se guarda localmente y nunca sale de tu teléfono.',
        ],
      },
      {
        h: '4. Uso de la aplicación',
        body: [
          'Turniq es una herramienta de registro personal de horarios y ganancias estimadas. Los cálculos de horas, ingresos, impuestos y horas extra son estimaciones basadas en los datos que tú introduces y no constituyen asesoría laboral, fiscal ni contable. Verifica siempre tus pagos reales con tu empleador.',
          'Te comprometes a utilizar la aplicación de forma lícita y a no intentar vulnerar su funcionamiento.',
        ],
      },
      {
        h: '5. "Invítame un café" (apoyos voluntarios)',
        body: [
          'La aplicación puede ofrecer apoyos voluntarios ("Invítame un café") a través de compras dentro de la app de Google Play. Son aportaciones únicas y voluntarias; no desbloquean funciones ni otorgan suscripción alguna. Los pagos los procesa Google Play y se rigen por sus políticas, incluidas las de reembolso.',
        ],
      },
      {
        h: '6. Disponibilidad y cambios',
        body: [
          'La aplicación se ofrece "tal cual" (as is), sin garantías de disponibilidad ininterrumpida ni de ausencia de errores. Podemos actualizar la aplicación y estos términos en cualquier momento; los cambios entrarán en vigor al publicar una nueva versión. El uso continuado de la aplicación después de un cambio implica la aceptación de los nuevos términos.',
        ],
      },
      {
        h: '7. Limitación de responsabilidad',
        body: [
          'En la máxima medida permitida por la ley, el desarrollador no será responsable por pérdidas de datos derivadas de la desinstalación, el borrado de datos del dispositivo, daños o fallos del equipo, ni por decisiones tomadas con base en las estimaciones que muestra la aplicación.',
        ],
      },
      {
        h: '8. Propiedad intelectual',
        body: [
          'Turniq, su nombre, diseño y código son propiedad de su desarrollador (HiroLifeCreative). Estos términos no te otorgan ningún derecho sobre la marca ni sobre el código fuente.',
        ],
      },
      {
        h: '9. Contacto',
        body: [
          'Si tienes preguntas sobre estos términos, puedes escribir a: nelsonherreraff@gmail.com',
        ],
      },
    ],
  },
  en: {
    updated: 'Last updated: October 20, 2026',
    sections: [
      {
        h: '1. Acceptance of terms',
        body: [
          'By downloading, installing or using Turniq you accept these Terms and Conditions in full. If you do not agree with any part, please do not use the app.',
        ],
      },
      {
        h: '2. Your data is 100% local',
        body: [
          'Turniq stores ALL of your information only on your device: jobs, shifts, wages, stations, settings and any backups you export. The app has no servers of its own, requires no account or sign-up, and never sends your information to the cloud or to third parties.',
          'This means that:',
          '• If you uninstall the app or clear its data, your information is permanently lost.\n• If you switch phones, you must export your backup from Settings → Data and import it on the new device.\n• You are solely responsible for keeping your own backups.',
        ],
      },
      {
        h: '3. Privacy',
        body: [
          'Turniq does not collect, sell or share personal data. The app includes no analytics, trackers or third-party advertising. The notifications you receive are generated locally on your device.',
          'Optionally, you may connect Google services (Calendar or Gmail) to sync your shifts. That sync happens directly between your device and your Google account, and is governed by Google\'s terms and privacy policy. Turniq does not intermediate or keep copies of that information outside your device.',
          'The PIN or biometric lock protects access to the app on your device; your PIN is stored locally and never leaves your phone.',
        ],
      },
      {
        h: '4. Use of the app',
        body: [
          'Turniq is a personal tool for logging work schedules and estimated earnings. Calculations of hours, income, taxes and overtime are estimates based on the data you enter and do not constitute employment, tax or accounting advice. Always verify your actual payments with your employer.',
          'You agree to use the app lawfully and not to attempt to compromise its operation.',
        ],
      },
      {
        h: '5. "Buy me a coffee" (voluntary tips)',
        body: [
          'The app may offer voluntary tips ("Buy me a coffee") through Google Play in-app purchases. They are one-time, voluntary contributions; they do not unlock features or grant any subscription. Payments are processed by Google Play and governed by its policies, including refund policies.',
        ],
      },
      {
        h: '6. Availability and changes',
        body: [
          'The app is provided "as is", without guarantees of uninterrupted availability or absence of errors. We may update the app and these terms at any time; changes take effect when a new version is published. Continued use of the app after a change implies acceptance of the new terms.',
        ],
      },
      {
        h: '7. Limitation of liability',
        body: [
          'To the maximum extent permitted by law, the developer shall not be liable for data loss resulting from uninstalling the app, clearing device data, device damage or failure, nor for decisions made based on the estimates shown by the app.',
        ],
      },
      {
        h: '8. Intellectual property',
        body: [
          'Turniq, its name, design and code are the property of its developer (HiroLifeCreative). These terms grant you no rights over the brand or the source code.',
        ],
      },
      {
        h: '9. Contact',
        body: [
          'If you have questions about these terms, you can write to: nelsonherreraff@gmail.com',
        ],
      },
    ],
  },
};

export function TermsScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation();
  const idioma = useStore((s) => s.settings.idioma);
  const content = CONTENT[idioma === 'en' ? 'en' : 'es'];

  return (
    <Screen banded>
      <TopBar onDark title={t.more.terms} onBack={() => nav.goBack()} />
      <ContentSheet>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        <Text style={{ fontSize: TYPE.caption, color: p.text3, marginBottom: SP.lg }}>{content.updated}</Text>
        {content.sections.map((s) => (
          <View key={s.h} style={{ marginBottom: SP.lg }}>
            <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.body, color: p.text, marginBottom: SP.xs }}>{s.h}</Text>
            {s.body.map((par, i) => (
              <Text key={i} style={{ fontSize: TYPE.caption + 1, lineHeight: 21, color: p.text2, marginBottom: SP.xs }}>
                {par}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
      </ContentSheet>
    </Screen>
  );
}
