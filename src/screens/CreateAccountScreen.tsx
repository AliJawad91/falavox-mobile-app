/* eslint-disable react-native/no-inline-styles */
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
// @ts-ignore: Module declaration for SVGs is missing in the project types
import QrCodeIcon from "../../assets/icons/ic_qr_code.svg";
import { clearError, registerUser } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../hooks/redux";

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;

function CreateAccountScreen({ navigation }: Props) {
    const [name, setName] = useState<string>('');
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [voiceID, setVoiceID] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true);
    const [secureConfirmPasswordEntry, setSecureConfirmPasswordEntry] = useState<boolean>(true);


    // Redux hooks
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
    const renderConfirmPasswordEyeIcon = () => (
        <Pressable
            style={({ pressed }) => [pressed ? style.pressedSecureTextEntryButtonStyle : style.secureTextEntryButtonStyle]}
            onPress={onConfirmPasswordEyePress}>

            {secureConfirmPasswordEntry ? (
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

    const onConfirmPasswordEyePress = () => {
        setSecureConfirmPasswordEntry(!secureConfirmPasswordEntry)
    }

    const handleSignup = async () => {
        console.log("handleSignup");
        

        if (!firstName || !lastName || !email || !voiceID || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long');
            return;
        }

        if (!validateEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (!validateConfirmPassword()){
            return Alert.alert('Error','Please make sure password & confirm password should be identical')
        }
        try {
            // Dispatch register action
            await dispatch(registerUser({
                userName: voiceID, // Using voiceID as username
                email: email,
                password: password,
                firstName: firstName, // Extract first name
                lastName: lastName, // Extract last name (if any)
                // Add other fields as needed by your API
            })).unwrap();

            // Success - navigation will be handled by useEffect below
        } catch (error) {
            // Error is handled by the slice and will show in the Alert via useEffect
        }
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateConfirmPassword = ():boolean=>{
        return password ===confirmPassword
    }
    // Handle navigation after successful registration
    useEffect(() => {
        if (isAuthenticated) {
            Alert.alert(
                'Success',
                'Account created successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Navigate to the main app screen or wherever you want
                            // For example:
                            navigation.replace('UserLibrary');
                            // Or reset the navigation stack:
                            // navigation.reset({
                            //     index: 0,
                            //     routes: [{ name: 'Main' }], // Replace 'Main' with your main screen name
                            // });
                        }
                    }
                ]
            );
        }
    }, [isAuthenticated, navigation]);

    // Handle errors
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

                    <Text style={style.headerTitleStyle}>Create Account</Text>

                </View>

                {/* <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}> */}
                <KeyboardAwareScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    enableOnAndroid={true}
                    extraScrollHeight={60}     // pushes screen up when keyboard opens
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    <View style={style.contentStyle}>

                        <Text style={style.fieldLabelStyle}>First Name</Text>

                        <View style={style.fieldContainerStyle}>

                            <TextInput
                                style={style.fieldInputStyle}
                                autoCapitalize="words"
                                selectionHandleColor={cursorColor}
                                cursorColor={cursorColor}
                                autoCorrect={false}
                                maxLength={30}
                                submitBehavior="blurAndSubmit"
                                value={firstName}
                                onChangeText={updatedName => setFirstName(updatedName)} />

                        </View>

                        <Text style={style.fieldLabelStyle}>Last Name</Text>

                        <View style={style.fieldContainerStyle}>

                            <TextInput
                                style={style.fieldInputStyle}
                                autoCapitalize="words"
                                selectionHandleColor={cursorColor}
                                cursorColor={cursorColor}
                                autoCorrect={false}
                                maxLength={30}
                                submitBehavior="blurAndSubmit"
                                value={lastName}
                                onChangeText={updatedName => setLastName(updatedName)} />

                        </View>

                        <Text style={style.fieldLabelStyle}>What's your Email?</Text>

                        <View style={style.fieldContainerStyle}>

                            <TextInput
                                style={style.fieldInputStyle}
                                selectionHandleColor={cursorColor}
                                cursorColor={cursorColor}
                                autoCorrect={false}
                                maxLength={30}
                                submitBehavior="blurAndSubmit"
                                value={email}
                                onChangeText={updatedEmail => setEmail(updatedEmail)} />

                        </View>

                        <Text style={style.fieldInfoStyle}>You'll need to confirm this email later</Text>

                        <Text style={style.fieldLabelStyle}>Voice ID</Text>

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

                        <Text style={style.fieldInfoStyle}>Create a unique Voice ID</Text>

                        <Text style={style.fieldLabelStyle}>Create a password</Text>

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
                        <Text style={style.fieldLabelStyle}>Confirm password</Text>

                        <View style={style.fieldContainerStyle}>

                            <TextInput
                                style={style.fieldInputStyle}
                                selectionHandleColor={cursorColor}
                                cursorColor={cursorColor}
                                autoCorrect={false}
                                maxLength={30}
                                secureTextEntry={secureConfirmPasswordEntry}
                                submitBehavior="blurAndSubmit"
                                value={confirmPassword}
                                onChangeText={updatedPassword => setConfirmPassword(updatedPassword)} />

                            {renderConfirmPasswordEyeIcon()}

                        </View>
                        <Text style={style.fieldInfoStyle}>Use atleast 8 characters</Text>
                        {isLoading ? (
                            <View style={style.loadingContainer}>
                                {/* <ActivityIndicator size="large" color={lightButtonBackground} /> */}
                                <Text style={style.loadingText}>Creating your account...</Text>
                            </View>
                        ) : (

                            <Pressable
                                style={({ pressed }) => [style.createAccountButtonStyle, { backgroundColor: pressed ? 'white' : lightButtonBackground }]}
                                onPress={() => {
                                    // console.log("Create account button pressed");
                                    // console.log("First Name:", firstName);
                                    // console.log("Last Name:", lastName);
                                    // console.log("Email:", email);
                                    // console.log("Voice ID:", voiceID);
                                    // console.log("Password:", password);
                                    handleSignup();
                                }}
                                disabled={!firstName || !lastName || !email || !voiceID || !password || isLoading}
                            >
                                <Text style={style.createAccountButtonTextStyle}>Create an account</Text>

                            </Pressable>
                        )
                        }

                        {/* <View style={style.qrCodeContainerStyle}>

                            <QrCodeIcon width={moderateScale(55)} height={moderateVerticalScale(55)} />

                            <Text style={style.qrCodeTextStyle}>Your QR code</Text>

                        </View> */}

                    </View>

                    {/* </ScrollView> */}
                </KeyboardAwareScrollView>

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
    fieldInfoStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontWeight: Platform.select({ ios: '400' }),
        fontSize: moderateScale(9),
        color: text,
        marginTop: moderateVerticalScale(2.5),
        marginStart: moderateScale(35)
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
    qrCodeContainerStyle: {
        position: 'absolute',
        start: 0,
        end: 0,
        bottom: 0,
        marginBottom: moderateVerticalScale(20),
        alignItems: 'center',
        justifyContent: 'center'
    },
    qrCodeTextStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontWeight: Platform.select({ ios: '400' }),
        fontSize: moderateScale(16),
        color: text,
        marginTop: moderateVerticalScale(5)
    }
});

export default CreateAccountScreen;