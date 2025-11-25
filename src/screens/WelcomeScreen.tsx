import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { background, buttonBorderColor, pressedLogInButtonBackground, pressedPrimaryButtonBackground, primaryButtonBackground, text } from "../utils/colors";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import { RootStackParamList } from "../../App";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import ConveyIcon from "../../assets/icons/ic_convey.svg";

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

function WelcomeScreen({ navigation }: Props) {

    const handleSignUpPress = () => {
        navigation.navigate('CreateAccount');
    }

    const handleLogInPress = () => {
        navigation.navigate('LogIn');
    }

    return (
        <SafeAreaView style={style.safeAreaStyle}>

            <View style={style.containerStyle}>

                <View style={style.layoutPortionStyle}>

                    <Text style={style.titleStyle}>Speak {"\n"}Your Way</Text>

                    <Text style={style.subtitleStyle}>we’ll translate the world.</Text>

                </View>

                <View style={style.layoutPortionStyle}>

                    <View style={{ marginTop: moderateVerticalScale(35) }}>

                        <ConveyIcon width={moderateScale(55)} height={moderateVerticalScale(55)} />

                    </View>

                    <Text style={style.brandMessageStyle}>Millions of Hastags. {"\n"}Free on Convey.</Text>

                    <Pressable
                        style={({ pressed }) => [style.signUpButtonStyle, { backgroundColor: pressed ? pressedPrimaryButtonBackground : primaryButtonBackground }]}
                        onPress={handleSignUpPress}>

                        <Text style={style.buttonTextStyle}>Sign up for free</Text>

                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [style.logInButtonStyle, { backgroundColor: pressed ? pressedLogInButtonBackground : 'transparent' }]}
                        onPress={handleLogInPress}>

                        <Text style={style.buttonTextStyle}>Log in</Text>

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
    layoutPortionStyle: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    titleStyle: {
        fontFamily: Platform.select({ ios: "Inter 18pt", android: "Inter_Light" }),
        fontWeight: Platform.select({ ios: "300" }),
        fontSize: moderateScale(52.39),
        lineHeight: moderateVerticalScale(50),
        color: text,
        textAlign: "center",
    },
    subtitleStyle: {
        fontFamily: Platform.select({ ios: "Inter 18pt", android: "Inter_Regular" }),
        fontWeight: Platform.select({ ios: "400" }),
        fontSize: moderateScale(17.96),
        lineHeight: moderateVerticalScale(25),
        color: text,
        textAlign: "center"
    },
    brandMessageStyle: {
        fontFamily: Platform.select({ ios: "Inter 18pt", android: "Inter_Bold" }),
        fontWeight: Platform.select({ ios: "700" }),
        fontSize: moderateScale(20.5),
        lineHeight: moderateVerticalScale(30),
        color: text,
        textAlign: 'center',
        marginTop: moderateVerticalScale(15)
    },
    signUpButtonStyle: {
        width: moderateScale(332),
        height: moderateVerticalScale(44),
        borderRadius: moderateScale(40),
        backgroundColor: primaryButtonBackground,
        marginTop: moderateVerticalScale(30),
        marginHorizontal: moderateScale(40),
        alignItems: 'center',
        justifyContent: 'center'
    },
    logInButtonStyle: {
        width: moderateScale(332),
        height: moderateVerticalScale(44),
        borderRadius: moderateScale(40),
        borderWidth: 1,
        backgroundColor: 'transparent',
        borderColor: buttonBorderColor,
        marginTop: moderateVerticalScale(15),
        marginHorizontal: moderateScale(40),
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonTextStyle: {
        fontFamily: Platform.select({ ios: "Inter 18pt", android: "Inter_Bold" }),
        fontWeight: Platform.select({ ios: "700" }),
        fontSize: moderateScale(13),
        lineHeight: moderateVerticalScale(24),
        color: text
    }
});

export default WelcomeScreen;