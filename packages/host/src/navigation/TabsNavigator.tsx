import React, {useEffect, useState} from 'react';
import {Platform, type ImageSourcePropType} from 'react-native';
import {createNativeBottomTabNavigator} from '@bottom-tabs/react-navigation';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {MaterialCommunityIcons as Icon} from '@expo/vector-icons';
import type {AppleIcon} from 'react-native-bottom-tabs';
import Placeholder from '../components/Placeholder';
import ErrorBoundary from '../components/ErrorBoundary';
import {colors} from '../theme';

// `sfSymbol` only renders on iOS, so Android needs rasterized ImageSources.
// @expo/vector-icons only renders them asynchronously, so they are prepared
// once before the tab bar mounts.
type MaterialIconName = React.ComponentProps<typeof Icon>['name'];

const ANDROID_TAB_ICONS = {
  Trading: 'chart-line',
  Wallet: 'credit-card',
  Account: 'account-circle',
} as const satisfies Record<string, MaterialIconName>;

type TabName = keyof typeof ANDROID_TAB_ICONS;
type AndroidTabIcons = Record<
  TabName,
  {focused: ImageSourcePropType; unfocused: ImageSourcePropType}
>;

const loadAndroidTabIcons = async (): Promise<AndroidTabIcons> => {
  const entries = await Promise.all(
    (Object.entries(ANDROID_TAB_ICONS) as [TabName, MaterialIconName][]).map(
      async ([tab, icon]) =>
        [
          tab,
          {
            focused: await Icon.getImageSource(icon, 24, colors.primary),
            unfocused: await Icon.getImageSource(icon, 24, colors.secondary),
          },
        ] as const,
    ),
  );
  return Object.fromEntries(entries) as AndroidTabIcons;
};

const tabIcon =
  (
    sfSymbol: AppleIcon['sfSymbol'],
    tab: TabName,
    androidIcons: AndroidTabIcons | null,
  ) =>
  ({focused}: {focused: boolean}) =>
    Platform.OS === 'ios'
      ? {sfSymbol}
      : (androidIcons?.[tab][focused ? 'focused' : 'unfocused'] ?? {sfSymbol});

const randomDelay = () =>
  new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 100));

const TradingApp = React.lazy(() =>
  randomDelay().then(() => import('trading/App')),
);
const WalletApp = React.lazy(() =>
  randomDelay().then(() => import('wallet/App')),
);
const AccountScreenRemote = React.lazy(() =>
  randomDelay().then(() => import('auth/AccountScreen')),
);

const TradingScreen = () => (
  <ErrorBoundary name="Trading">
    <React.Suspense
      fallback={<Placeholder label="Trading" icon="chart-line" />}>
      <TradingApp />
    </React.Suspense>
  </ErrorBoundary>
);

const WalletScreen = () => (
  <ErrorBoundary name="Wallet">
    <React.Suspense fallback={<Placeholder label="Wallet" icon="wallet" />}>
      <WalletApp />
    </React.Suspense>
  </ErrorBoundary>
);

const AccountRemoteScreen = () => (
  <ErrorBoundary name="Account">
    <React.Suspense fallback={<Placeholder label="Account" icon="person" />}>
      <AccountScreenRemote />
    </React.Suspense>
  </ErrorBoundary>
);

const AccountStack = createNativeStackNavigator();

const AccountScreen = () => (
  <AccountStack.Navigator
    screenOptions={{
      headerStyle: {backgroundColor: colors.background},
      headerTintColor: colors.onBackground,
      headerTitleStyle: {color: colors.onBackground},
      contentStyle: {backgroundColor: colors.background},
    }}>
    <AccountStack.Screen
      name="AccountMain"
      component={AccountRemoteScreen}
      options={{title: 'Account'}}
    />
  </AccountStack.Navigator>
);

export type TabsParamList = {
  Trading: undefined;
  Wallet: undefined;
  Account: undefined;
};

const Tabs = createNativeBottomTabNavigator<TabsParamList>();

const TabsNavigator = () => {
  const [androidIcons, setAndroidIcons] = useState<AndroidTabIcons | null>(
    null,
  );

  useEffect(() => {
    if (Platform.OS === 'android') {
      loadAndroidTabIcons().then(setAndroidIcons, console.warn);
    }
  }, []);

  if (Platform.OS === 'android' && !androidIcons) {
    return null;
  }

  return (
    <Tabs.Navigator
      translucent={false}
      tabBarStyle={{backgroundColor: colors.surface}}
      tabBarActiveTintColor={colors.primary}
      tabBarInactiveTintColor={colors.secondary}
      screenOptions={{sceneStyle: {backgroundColor: colors.background}}}>
      <Tabs.Screen
        name="Trading"
        component={TradingScreen}
        options={{
          title: 'Trading',
          tabBarIcon: tabIcon('chart.line.uptrend.xyaxis', 'Trading', androidIcons),
        }}
      />
      <Tabs.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          title: 'Wallet',
          tabBarIcon: tabIcon('creditcard', 'Wallet', androidIcons),
        }}
      />
      <Tabs.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'Account',
          tabBarIcon: tabIcon('person.crop.circle', 'Account', androidIcons),
        }}
      />
    </Tabs.Navigator>
  );
};

export default TabsNavigator;
