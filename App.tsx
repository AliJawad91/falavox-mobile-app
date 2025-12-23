import React from 'react';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';

import { NavigationContainer } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';

import { ChannelTokenDataInterface, User } from './src/types';

import AppInitializer from './src/components/wrappers/AppInitializer';

import { APP_CONFIG } from './src/config';

import { StripeProvider } from '@stripe/stripe-react-native';
import RootNavigator from './src/navigation/RootNavigator';

enableScreens();

export type RootStackParamList = {
  Welcome: undefined;
  CreateAccount: undefined;
  LogIn: undefined;
  UserLibrary: undefined;
  CallUI: {
    calledUser: User;
    channel: string;
    channelTokenData: ChannelTokenDataInterface;
    uid: number;
    expiresAt?: number;
  };
  Settings: undefined;
  Purchase: undefined;
};

export default function App() {

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StripeProvider publishableKey={APP_CONFIG.STRIPE_PUBLISHABLE_KEY}>
          <NavigationContainer>
            <AppInitializer>
              <RootNavigator />
              {/* <RootNavigation /> */}
            </AppInitializer>
          </NavigationContainer>
        </StripeProvider>
      </PersistGate>
    </Provider>
  );
}
