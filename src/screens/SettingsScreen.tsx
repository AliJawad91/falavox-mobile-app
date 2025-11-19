import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import { RootStackParamList } from "../../App";
import { blackBackground, blackText, cursorColor, headerBackground, icon, pressedIconButtonBackground, pressedPrimaryButtonBackground, primaryButtonBackground, text, whiteFieldContainerBackground } from "../utils/colors";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import BackIcon from "../../assets/icons/ic_back_plain.svg";

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function SettingsScreen({ navigation }: Props) {
    const [tag, setTag] = useState<string>('');

    const inset = useSafeAreaInsets();

    const handleBackPress = () => {
        navigation.goBack();
    };

    return (
        <View style={{ ...style.safeAreaStyle, paddingBottom: inset.bottom }}>

            <View style={{ ...style.headerStyle, paddingTop: inset.top }}>

                <Pressable
                    style={({ pressed }) => [
                        pressed ? style.pressedHeaderButtonStyle : style.headerButtonStyle,
                        { marginStart: moderateScale(10) }
                    ]}
                    onPress={handleBackPress}>

                    <BackIcon style={{ color: icon }}
                        width={moderateScale(15)} height={moderateVerticalScale(15)} />

                </Pressable>

                <Text style={style.headerTitleStyle}>Settings</Text>

            </View>

            <View style={style.containerStyle}>

                <View style={style.searchTagFieldContainerStyle}>

                    <TextInput
                        style={style.fieldInputStyle}
                        placeholder="Search #Tag"
                        placeholderTextColor={blackText}
                        selectionHandleColor={cursorColor}
                        cursorColor={cursorColor}
                        autoCorrect={false}
                        maxLength={50}
                        submitBehavior="blurAndSubmit"
                        value={tag}
                        onChangeText={(updateHashTag: string) => setTag(updateHashTag)} />

                </View>

                <Pressable
                    style={({ pressed }) => [style.startCallButtonStyle, { backgroundColor: pressed ? pressedPrimaryButtonBackground : primaryButtonBackground }]}
                    onPress={null}>

                    <Text style={style.startCallButtonLabelStyle}>Start Call</Text>

                </Pressable>

            </View>

        </View>
    );
}

const style = StyleSheet.create({
    safeAreaStyle: {
        flex: 1,
        backgroundColor: blackBackground
    },
    containerStyle: {
        flex: 1,
        justifyContent: 'center'
    },
    headerStyle: {
        backgroundColor: headerBackground,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: moderateVerticalScale(10)
    },
    headerButtonStyle: {
        position: 'absolute',
        start: 0,
        bottom: 0,
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateVerticalScale(10),
        borderRadius: moderateScale(30),
        aspectRatio: 1
    },
    pressedHeaderButtonStyle: {
        position: 'absolute',
        start: 0,
        bottom: 0,
        backgroundColor: pressedIconButtonBackground,
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateVerticalScale(10),
        borderRadius: moderateScale(30),
        aspectRatio: 1
    },
    headerTitleStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Bold' }),
        fontWeight: Platform.select({ ios: '700' }),
        fontSize: moderateScale(14),
        color: text,
        textAlign: 'center'
    },
    searchTagFieldContainerStyle: {
        height: moderateVerticalScale(40),
        backgroundColor: whiteFieldContainerBackground,
        borderRadius: moderateScale(5),
        marginHorizontal: moderateScale(25),
        alignItems: 'center'
    },
    fieldInputStyle: {
        width: '100%',
        height: '100%',
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontWeight: Platform.select({ ios: '400' }),
        fontSize: moderateScale(13),
        marginHorizontal: moderateScale(10),
        paddingHorizontal: moderateScale(10),
        color: blackText
    },
    startCallButtonStyle: {
        height: moderateVerticalScale(40),
        backgroundColor: primaryButtonBackground,
        borderRadius: moderateScale(5),
        marginHorizontal: moderateScale(25),
        marginTop: moderateVerticalScale(20),
        alignItems: 'center',
        justifyContent: 'center'
    },
    startCallButtonLabelStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_ExtraBold' }),
        fontWeight: Platform.select({ ios: '800' }),
        fontSize: moderateScale(13),
        color: text
    }
});

export default SettingsScreen;