// import { useEffect } from 'react';
// import { useAppDispatch } from '../../hooks/redux';
// import { getMe } from '../../features/userProfile/userProfileSlice';


// interface AppInitializerProps {
//     children: React.ReactNode;
// }

// export default function AppInitializer({ children }: AppInitializerProps) {
//     const dispatch = useAppDispatch();

//     useEffect(() => {
//         dispatch(getMe());
//     }, []);

//     return <>{children}</>;
// }
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getMe } from '../../features/userProfile/userProfileSlice';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

interface AppInitializerProps {
    children: React.ReactNode;
}

export default function AppInitializer({ children }: AppInitializerProps) {
    const dispatch = useAppDispatch();
    const me = useAppSelector(state => state.userProfile.profile);
    const loading = useAppSelector(state => state.userProfile.isLoading);
    const token = useAppSelector((state) => state.auth.tokens?.accessToken); // your token

    useEffect(() => {
        if (token) {
            dispatch(getMe());
        }
    }, [token]);
    console.log(me, "MEEE");

    if (loading && !me) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }


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
