/* eslint-disable react-native/no-inline-styles */
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;

function CreateAccountScreen({ navigation }: Props) {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [hashTag, setHashTag] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true);

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

                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}>

                    <View style={style.contentStyle}>

                        <Text style={style.fieldLabelStyle}>Name</Text>

                        <View style={style.fieldContainerStyle}>

                            <TextInput
                                style={style.fieldInputStyle}
                                autoCapitalize="words"
                                selectionHandleColor={cursorColor}
                                cursorColor={cursorColor}
                                autoCorrect={false}
                                maxLength={30}
                                submitBehavior="blurAndSubmit"
                                value={name}
                                onChangeText={updatedName => setName(updatedName)} />

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

                        <Text style={style.fieldLabelStyle}>#Tag</Text>

                        <View style={style.fieldContainerStyle}>

                            <TextInput
                                style={style.fieldInputStyle}
                                selectionHandleColor={cursorColor}
                                cursorColor={cursorColor}
                                autoCorrect={false}
                                maxLength={30}
                                submitBehavior="blurAndSubmit"
                                value={hashTag}
                                onChangeText={updateHashTag => setHashTag(updateHashTag)} />

                        </View>

                        <Text style={style.fieldInfoStyle}>Create a unique #Tag</Text>

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

                        <Text style={style.fieldInfoStyle}>Use atleast 8 characters</Text>

                        <Pressable
                            style={({ pressed }) => [style.createAccountButtonStyle, { backgroundColor: pressed ? 'white' : lightButtonBackground }]}
                            onPress={null}>

                            <Text style={style.createAccountButtonTextStyle}>Create an account</Text>

                        </Pressable>

                        <View style={style.qrCodeContainerStyle}>

                            <QrCodeIcon width={moderateScale(55)} height={moderateVerticalScale(55)} />

                            <Text style={style.qrCodeTextStyle}>Your QR code</Text>

                        </View>

                    </View>

                </ScrollView>

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