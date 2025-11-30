import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';


import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JoinScreen from './src/screens/JoinScreen';
import CallScreen from './src/screens/CallScreen';
import { enableScreens } from 'react-native-screens';
import { ChannelTokenDataInterface } from './src/types';
import WelcomeScreen from './src/screens/WelcomeScreen';
import CreateAccountScreen from './src/screens/CreateAccountScreen';
import LogInScreen from './src/screens/LogInScreen';
import UserLibraryScreen from './src/screens/UserLibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CallScreenUI from './src/screens/CallScreenUI';

enableScreens();

export type RootStackParamList = {
  Welcome: undefined;
  CreateAccount: undefined;
  LogIn: undefined;
  UserLibrary: undefined;
  Join: undefined;
  CallUI: undefined;
  Call: {
    channel: string;
    language: string;
    channelTokenData: ChannelTokenDataInterface;
    uid: number;
    expiresAt?: number;
  };
  Settings: undefined;
};
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // useEffect(() => {
  //   // Load tokens when app starts
  //   store.dispatch(loadTokens());
  // }, []);
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Welcome">
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateAccount" component={CreateAccountScreen} options={{ headerShown: false }} />
            <Stack.Screen name="LogIn" component={LogInScreen} options={{ headerShown: false }} />
            <Stack.Screen name="UserLibrary" component={UserLibraryScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Join" component={JoinScreen} />
            <Stack.Screen name="CallUI" component={CallScreenUI} options={{ headerShown: false }} />
            <Stack.Screen name="Call" component={CallScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
}
