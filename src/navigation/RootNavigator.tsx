import React from 'react';
import { useAppSelector } from '../hooks/redux';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

export default function RootNavigator() {
  const token = useAppSelector(
    (state) => state.auth.tokens?.accessToken
  );

  return token ? <AppNavigator /> : <AuthNavigator />;
}
