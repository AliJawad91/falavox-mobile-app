import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JoinScreen from './src/screens/JoinScreen';
import CallScreen from './src/screens/CallScreen';
import { enableScreens } from 'react-native-screens';
import { ChannelTokenDataInterface } from './src/types';

enableScreens();

export type RootStackParamList = {
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
      <Stack.Navigator initialRouteName="Join">
        <Stack.Screen name="Join" component={JoinScreen} />
        <Stack.Screen name="Call" component={CallScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
