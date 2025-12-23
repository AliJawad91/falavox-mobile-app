
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getMe } from '../../features/userProfile/userProfileSlice';
import { StyleSheet } from 'react-native';

interface AppInitializerProps {
    children: React.ReactNode;
}

export default function AppInitializer({ children }: AppInitializerProps) {
    const dispatch = useAppDispatch();
    const token = useAppSelector(state => state.auth.tokens?.accessToken);
    const me = useAppSelector(state => state.userProfile.profile);
  
    useEffect(() => {
      if (token && !me) {
        dispatch(getMe());
      }
    }, [token]);
  
    return <>{children}</>;
  }
  

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black'
    },
});
