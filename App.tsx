import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JoinScreen from './src/screens/JoinScreen';
import CallScreen from './src/screens/CallScreen';
import { enableScreens } from 'react-native-screens';
import { ChannelTokenDataInterface } from './src/types';
import WelcomeScreen from './src/screens/WelcomeScreen';
import CreateAccountScreen from './src/screens/CreateAccountScreen';
import LogInScreen from './src/screens/LogInScreen';

enableScreens();

export type RootStackParamList = {
  Welcome: undefined;
  CreateAccount: undefined;
  LogIn: undefined;
  Join: undefined;
  Call: {
    channel: string;
    language: string;
    channelTokenData: ChannelTokenDataInterface;
    uid: number;
    expiresAt?: number;
  };
};
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LogIn" component={LogInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Join" component={JoinScreen} />
        <Stack.Screen name="Call" component={CallScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
