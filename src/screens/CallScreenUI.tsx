import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import { RootStackParamList } from "../../App";
import { bottomGradientColor, buttonBorderColor, icon, pressedIconButtonBackground, pressedPrimaryButtonBackground, primaryButtonBackground, secondaryText, text, topGradientColor } from "../utils/colors";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import BackIcon from "../../assets/icons/ic_back_plain.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import MuteIcon from "../../assets/icons/ic_mic_off.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import SpeakerIcon from "../../assets/icons/ic_speaker.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import PhoneIcon from "../../assets/icons/ic_phone.svg";

type Props = NativeStackScreenProps<RootStackParamList, 'CallUI'>;

function CallScreenUI({ navigation }: Props) {

    const handleBackPress = () => {
        navigation.goBack();
    };

    return (
        <LinearGradient
            style={style.gradientContainerStyle}
            colors={[topGradientColor, bottomGradientColor]}>

            <SafeAreaView style={style.safeAreaStyle}>


                <View style={style.headerStyle}>

                    <Pressable
                        style={({ pressed }) => [
                            pressed ? style.pressedHeaderButtonStyle : style.headerButtonStyle,
                            { marginStart: moderateScale(10) }
                        ]}
                        onPress={handleBackPress}>

                        <BackIcon style={{ color: icon }}
                            width={moderateScale(15)} height={moderateVerticalScale(15)} />

                    </Pressable>

                </View>

                <View style={style.contentStyle}>

                    <View style={style.callInfoContainerStyle}>

                        <Text style={style.callTimeTextStyle}>1:58</Text>

                        <Text style={style.callNameTextStyle}>John Doe</Text>

                        <Text style={style.callHashTagTextStyle}>#JohnDoe</Text>

                        <View style={style.callControlContainerStyle}>

                            <Pressable
                                style={({ pressed }) => [style.callControlButtonStyle, { backgroundColor: pressed ? pressedIconButtonBackground : 'transparent' }]}
                                onPress={null}>

                                <MuteIcon
                                    style={{ color: icon }}
                                    width={moderateScale(25)}
                                    height={moderateVerticalScale(25)} />

                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [style.callControlButtonStyle, { backgroundColor: pressed ? pressedIconButtonBackground : 'transparent' }]}
                                onPress={null}>

                                <SpeakerIcon
                                    style={{ color: icon }}
                                    width={moderateScale(25)}
                                    height={moderateVerticalScale(25)} />

                            </Pressable>

                        </View>

                        <Pressable
                            style={({ pressed }) => [style.callEndButtonStyle, { backgroundColor: pressed ? pressedPrimaryButtonBackground : primaryButtonBackground }]}
                            onPress={null}>

                            <PhoneIcon
                                style={{ color: icon }}
                                width={moderateScale(30)}
                                height={moderateVerticalScale(30)} />

                        </Pressable>

                    </View>

                </View>

            </SafeAreaView>

        </LinearGradient>
    );
}

const style = StyleSheet.create({
    gradientContainerStyle: {
        flex: 1
    },
    safeAreaStyle: {
        flex: 1
    },
    containerStyle: {
        flex: 1
    },
    headerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerButtonStyle: {
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateVerticalScale(10),
        borderRadius: moderateScale(30),
        aspectRatio: 1
    },
    pressedHeaderButtonStyle: {
        backgroundColor: pressedIconButtonBackground,
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateVerticalScale(10),
        borderRadius: moderateScale(30),
        aspectRatio: 1
    },
    contentStyle: {
        flex: 1,
        paddingVertical: moderateVerticalScale(20),
        justifyContent: 'center'
    },
    callInfoContainerStyle: {
        flex: 0.7,
        alignItems: 'center'
    },
    callTimeTextStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontWeight: Platform.select({ ios: '400' }),
        fontSize: moderateScale(14),
        color: text
    },
    callNameTextStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Bold' }),
        fontWeight: Platform.select({ ios: '700' }),
        fontSize: moderateScale(35),
        color: text,
        marginTop: moderateVerticalScale(80)
    },
    callHashTagTextStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontWeight: Platform.select({ ios: '400' }),
        fontSize: moderateScale(23),
        color: secondaryText,
        marginTop: moderateVerticalScale(10)
    },
    callControlContainerStyle: {
        flexDirection: 'row',
        marginTop: moderateVerticalScale(50)
    },
    callControlButtonStyle: {
        width: moderateScale(55),
        height: moderateVerticalScale(55),
        borderRadius: moderateScale(30),
        borderColor: buttonBorderColor,
        borderWidth: 1,
        aspectRatio: 1,
        marginHorizontal: moderateScale(10),
        alignItems: 'center',
        justifyContent: 'center'
    },
    callEndButtonStyle: {
        width: moderateScale(65),
        height: moderateVerticalScale(65),
        borderRadius: moderateScale(50),
        backgroundColor: primaryButtonBackground,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: moderateVerticalScale(120)
    }
});

export default CallScreenUI;