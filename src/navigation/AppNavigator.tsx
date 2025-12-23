import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import UserLibraryScreen from '../screens/UserLibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PurchaseScreen from '../screens/PurchaseScreen';
import CallScreenUI from '../screens/CallScreenUI';
import { RootStackParamList } from '../../App';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="UserLibrary"
                component={UserLibraryScreen}
                options={{
                    headerShown: false,
                    gestureEnabled: false
                    //  headerLeft: () => null,
                }}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Purchase" component={PurchaseScreen} />
            <Stack.Screen name="CallUI" component={CallScreenUI} />
        </Stack.Navigator>
    );
}
