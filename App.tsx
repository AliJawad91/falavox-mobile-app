import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';


import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JoinScreen from './src/screens/JoinScreen';
import CallScreen from './src/screens/CallScreen';
import { enableScreens } from 'react-native-screens';
import { ChannelTokenDataInterface, User } from './src/types';
import WelcomeScreen from './src/screens/WelcomeScreen';
import CreateAccountScreen from './src/screens/CreateAccountScreen';
import LogInScreen from './src/screens/LogInScreen';
import UserLibraryScreen from './src/screens/UserLibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CallScreenUI from './src/screens/CallScreenUI';
import { useAppDispatch, useAppSelector } from './src/hooks/redux';
import { getMe } from './src/features/userProfile/userProfileSlice';
import AppInitializer from './src/components/wrappers/AppInitializer';
import LoadingScreen from './src/components/common/LoadingScreen';

enableScreens();

export type RootStackParamList = {
  Welcome: undefined;
  CreateAccount: undefined;
  LogIn: undefined;
  UserLibrary: undefined;
  Join: undefined;
  CallUI: {
    calledUser:User;
    channel: string;
    channelTokenData: ChannelTokenDataInterface;
    uid: number;
    expiresAt?: number;
  };
  Call: {
    channel: string;
    // language: string;
    channelTokenData: ChannelTokenDataInterface;
    uid: number;
    expiresAt?: number;
  };
  Settings: undefined;
};
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer>
          <AppInitializer>
            <RootNavigation />
            {/* <Stack.Navigator initialRouteName="Welcome">
              <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
              <Stack.Screen name="CreateAccount" component={CreateAccountScreen} options={{ headerShown: false }} />
              <Stack.Screen name="LogIn" component={LogInScreen} options={{ headerShown: false }} />
              <Stack.Screen name="UserLibrary" component={UserLibraryScreen}
                options={{
                  headerShown: false,
                  gestureEnabled: false
                  //  headerLeft: () => null,
                }} />
              <Stack.Screen name="Join" component={JoinScreen} />
              <Stack.Screen name="CallUI" component={CallScreenUI} options={{ headerShown: false }} />
              <Stack.Screen name="Call" component={CallScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
            </Stack.Navigator> */}
          </AppInitializer>
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
}

function RootNavigation() {
  const { tokens, isLoading } = useAppSelector((state) => state.auth);

  // Show splash while checking user
  if (isLoading) {
    return <LoadingScreen />; // make a simple component
  }

  return (
    <Stack.Navigator initialRouteName={tokens?.accessToken ? "UserLibrary" : "Welcome"} screenOptions={{gestureEnabled: false}}>
      {!tokens?.accessToken && (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CreateAccount" component={CreateAccountScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LogIn" component={LogInScreen} options={{ headerShown: false }} />
        </>
      )}

      {tokens?.accessToken && (
        <>
          <Stack.Screen name="UserLibrary" component={UserLibraryScreen}
            options={{
              headerShown: false,
              gestureEnabled: false
              //  headerLeft: () => null,
            }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Join" component={JoinScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CallUI" component={CallScreenUI} options={{ headerShown: false }} />
          <Stack.Screen name="Call" component={CallScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}
