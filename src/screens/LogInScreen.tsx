/* eslint-disable react-native/no-inline-styles */
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import { RootStackParamList } from "../../App";
import { backButtonBackground, background, cursorColor, fieldContainerBackground, icon, lightButtonBackground, lightButtonText, pressedBackButtonBackground, pressedIconButtonBackground, text } from "../utils/colors";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import BackIcon from "../../assets/icons/ic_back.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import EyeOffIcon from "../../assets/icons/ic_eye_off.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import EyeOnIcon from "../../assets/icons/ic_eye_on.svg";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { clearError, loginUser } from "../features/auth/authSlice";
import TokenService from "../services/tokenService";

type Props = NativeStackScreenProps<RootStackParamList, 'LogIn'>;

function LogInScreen({ navigation }: Props) {
    const [voiceID, setVoiceID] = useState<string>('');
    const [password, setPassword] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const dispatch = useAppDispatch();
    const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

    const handleOnBackPress = () => {
        navigation.goBack();
    }

    const renderEyeIcon = () => (
        <Pressable
            style={({ pressed }) => [pressed ? style.pressedSecureTextEntryButtonStyle : style.secureTextEntryButtonStyle]}
            onPress={onEyeIconPress}>

            {secureTextEntry ? (
                <EyeOnIcon
                    style={{ color: icon }}
                    width={moderateScale(24)}
                    height={moderateVerticalScale(24)} />
            ) : (
                <EyeOffIcon
                    style={{ color: icon }}
                    width={moderateScale(24)}
                    height={moderateVerticalScale(24)} />
            )}

        </Pressable>
    );

    const onEyeIconPress = () => {
        setSecureTextEntry(!secureTextEntry);
    };

    const handleLogin = async () => {
        console.log("handle Login called");
        
        if (!voiceID || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            // Dispatch register action
            await dispatch(loginUser({
                userName: voiceID, // Using voiceID as username
                password: password,
                // Add other fields as needed by your API
            })).unwrap();
            const testTokenService = await TokenService.getAccessToken();
            console.log(testTokenService,"testTokenService");
            
            // Success - navigation will be handled by useEffect below
        } catch (error) {
            // Error is handled by the slice and will show in the Alert via useEffect
        }

    }

    useEffect(() => {
        if (isAuthenticated) {
            // Alert.alert(
            //     'Success',
            //     'Account created successfully!',
            //     [
            //         {
            //             text: 'OK',
            //             onPress: () => {
                            // Navigate to the main app screen or wherever you want
                            // For example:
                            navigation.replace('UserLibrary');
                            // Or reset the navigation stack:
                            // navigation.reset({
                            //     index: 0,
                            //     routes: [{ name: 'Main' }], // Replace 'Main' with your main screen name
                            // });
                //         }
                //     }
                // ]
            // );
        }
    }, [isAuthenticated, navigation]);

    useEffect(() => {
        if (error) {
            Alert.alert('Registration Error', error);
            dispatch(clearError());
        }
    }, [error, dispatch]);
    return (
        <SafeAreaView style={style.safeAreaStyle}>

            <View style={style.containerStyle}>

                <View style={style.headerStyle}>

                    <Pressable
                        style={{ position: 'absolute', marginStart: moderateScale(10), start: 0 }}
                        onPress={handleOnBackPress}>
                        {({ pressed }) => (
                            <BackIcon style={{ color: pressed ? pressedBackButtonBackground : backButtonBackground }} width={moderateScale(30)} height={moderateVerticalScale(30)} />
                        )}

                    </Pressable>

                    <Text style={style.headerTitleStyle}>Log In</Text>

                </View>

                <View style={style.contentStyle}>

                    <Text style={style.fieldLabelStyle}>#Tag</Text>

                    <View style={style.fieldContainerStyle}>

                        <TextInput
                            style={style.fieldInputStyle}
                            selectionHandleColor={cursorColor}
                            cursorColor={cursorColor}
                            autoCorrect={false}
                            maxLength={30}
                            submitBehavior="blurAndSubmit"
                            value={voiceID}
                            onChangeText={updateVoiceID => setVoiceID(updateVoiceID)} />

                    </View>

                    <Text style={style.fieldLabelStyle}>Password</Text>

                    <View style={style.fieldContainerStyle}>

                        <TextInput
                            style={style.fieldInputStyle}
                            selectionHandleColor={cursorColor}
                            cursorColor={cursorColor}
                            autoCorrect={false}
                            maxLength={30}
                            secureTextEntry={secureTextEntry}
                            submitBehavior="blurAndSubmit"
                            value={password}
                            onChangeText={updatedPassword => setPassword(updatedPassword)} />

                        {renderEyeIcon()}

                    </View>
                    {isLoading ? (
                        <View style={style.loadingContainer}>
                            {/* <ActivityIndicator size="large" color={lightButtonBackground} /> */}
                            <Text style={style.loadingText}>Logging In...</Text>
                        </View>
                    ) : (
                        <Pressable
                            style={({ pressed }) => [style.createAccountButtonStyle, { backgroundColor: pressed ? 'white' : lightButtonBackground }]}
                            onPress={handleLogin}>

                            <Text style={style.createAccountButtonTextStyle}>Log In</Text>

                        </Pressable>
                    )}

                </View>

            </View>

        </SafeAreaView>
    );
}

const style = StyleSheet.create({
    safeAreaStyle: {
        flex: 1,
        backgroundColor: background
    },
    containerStyle: {
        flex: 1
    },
    headerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitleStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Bold' }),
        fontWeight: Platform.select({ ios: '700' }),
        fontSize: moderateScale(14),
        color: text,
        textAlign: 'center'
    },
    contentStyle: {
        flex: 1,
        paddingVertical: moderateVerticalScale(20),
    },
    loadingContainer: {
        marginTop: moderateVerticalScale(40),
        alignItems: 'center',
        justifyContent: 'center'
    },
    loadingText: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontWeight: Platform.select({ ios: '400' }),
        fontSize: moderateScale(14),
        color: text,
        marginTop: moderateVerticalScale(10)
    },
    fieldLabelStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Bold' }),
        fontWeight: Platform.select({ ios: '700' }),
        fontSize: moderateScale(17),
        color: text,
        marginTop: moderateVerticalScale(10),
        marginStart: moderateScale(35)
    },
    fieldContainerStyle: {
        flexDirection: 'row',
        height: moderateVerticalScale(45),
        backgroundColor: fieldContainerBackground,
        borderRadius: moderateScale(5),
        marginVertical: moderateVerticalScale(10),
        marginHorizontal: moderateScale(25),
        alignItems: 'center'
    },
    fieldInputStyle: {
        flex: 1,
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontWeight: Platform.select({ ios: '400' }),
        fontSize: moderateScale(16),
        marginHorizontal: moderateScale(10),
        color: text
    },
    secureTextEntryButtonStyle: {
        width: moderateScale(30),
        height: moderateVerticalScale(30),
        borderRadius: moderateScale(15),
        marginEnd: moderateScale(5),
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    pressedSecureTextEntryButtonStyle: {
        backgroundColor: pressedIconButtonBackground,
        width: moderateScale(30),
        height: moderateVerticalScale(30),
        borderRadius: moderateScale(15),
        marginEnd: moderateScale(5),
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    createAccountButtonStyle: {
        width: moderateScale(175),
        height: moderateVerticalScale(37),
        backgroundColor: lightButtonBackground,
        borderRadius: moderateScale(20),
        marginTop: moderateVerticalScale(40),
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center'
    },
    createAccountButtonTextStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontWeight: Platform.select({ ios: '400' }),
        fontSize: moderateScale(13),
        color: lightButtonText
    }
});

export default LogInScreen;