import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import type { Theme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase, recordAudit } from './src/memory';
import { colors, spacing } from './src/theme';
import { SessionProvider } from './src/ui/SessionContext';
import { ChatScreen } from './src/ui/screens/ChatScreen';
import { MemoryScreen } from './src/ui/screens/MemoryScreen';
import { SettingsScreen } from './src/ui/screens/SettingsScreen';
import { TaskScreen } from './src/ui/screens/TaskScreen';
import type { RootTabParamList } from './src/ui/navigation';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash control is best effort; the app works without it.
});

const Tab = createBottomTabNavigator<RootTabParamList>();

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

const TAB_ICONS: Record<keyof RootTabParamList, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Chat: { active: 'chatbubble-ellipses', inactive: 'chatbubble-ellipses-outline' },
  Memory: { active: 'sparkles', inactive: 'sparkles-outline' },
  Tasks: { active: 'shield-checkmark', inactive: 'shield-checkmark-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

const TAB_LABELS: Record<keyof RootTabParamList, string> = {
  Chat: '대화',
  Memory: '기억',
  Tasks: '작업',
  Settings: '설정',
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        await initDatabase();
        await recordAudit('app.started', 'SQLite 준비 완료 · PHASE 1');
        if (!cancelled) setReady(true);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : '데이터베이스를 열지 못했습니다.');
        }
      } finally {
        void SplashScreen.hideAsync().catch(() => undefined);
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>앱을 시작하지 못했습니다</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>로컬 데이터베이스 준비 중…</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="dark" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: colors.accent,
              tabBarInactiveTintColor: colors.tabInactive,
              tabBarStyle: styles.tabBar,
              tabBarLabelStyle: styles.tabLabel,
              tabBarIcon: ({ focused, color, size }) => {
                const icons = TAB_ICONS[route.name];
                return (
                  <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />
                );
              },
            })}
          >
            <Tab.Screen name="Chat" component={ChatScreen} options={{ title: TAB_LABELS.Chat }} />
            <Tab.Screen name="Memory" component={MemoryScreen} options={{ title: TAB_LABELS.Memory }} />
            <Tab.Screen name="Tasks" component={TaskScreen} options={{ title: TAB_LABELS.Tasks }} />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: TAB_LABELS.Settings }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  errorBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.danger,
    textAlign: 'center',
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 62,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
