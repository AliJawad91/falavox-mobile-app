/* eslint-disable react-native/no-inline-styles */
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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

type Props = NativeStackScreenProps<RootStackParamList, 'LogIn'>;

function LogInScreen({ navigation }: Props) {
    const [hashTag, setHashTag] = useState('');
    const [password, setPassword] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);

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
                            value={hashTag}
                            onChangeText={updateHashTag => setHashTag(updateHashTag)} />

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

                    <Pressable
                        style={({ pressed }) => [style.createAccountButtonStyle, { backgroundColor: pressed ? 'white' : lightButtonBackground }]}
                        onPress={null}>

                        <Text style={style.createAccountButtonTextStyle}>Log In</Text>

                    </Pressable>

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