import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLayoutEffect, useState } from "react";
import { Platform, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../../App";
import { blackText, bottomGradientColor, cursorColor, icon, pressedIconButtonBackground, pressedPrimaryButtonBackground, primaryButtonBackground, secondaryText, text, topGradientColor, whiteFieldContainerBackground } from "../utils/colors";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import BackIcon from "../../assets/icons/ic_back_plain.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import MoreIcon from "../../assets/icons/ic_more.svg";
import { FlashList } from "@shopify/flash-list";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import QrCodeIcon from "../../assets/icons/ic_qr_code.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import AddIcon from "../../assets/icons/ic_add.svg";

type Props = NativeStackScreenProps<RootStackParamList, 'UserLibrary'>;

function UserLibraryScreen({ navigation }: Props) {
    const [tag, setTag] = useState<string>('');

    useLayoutEffect(() => {
        StatusBar.setBarStyle('light-content');
    }, []);

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleMorePress = () => { };

    return (
        <LinearGradient
            style={style.gradientContainerStyle}
            colors={[topGradientColor, bottomGradientColor]}
            locations={[0, 0.5]}>

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

                    <Pressable
                        style={({ pressed }) => [
                            pressed ? style.pressedHeaderButtonStyle : style.headerButtonStyle,
                            { marginEnd: moderateScale(10) }
                        ]}
                        onPress={handleMorePress}>

                        <MoreIcon style={{ color: icon }}
                            width={moderateScale(25)} height={moderateVerticalScale(25)} />

                    </Pressable>

                </View>

                <View style={style.contentStyle}>

                    <View style={style.userInfoContainerStyle}>

                        <View style={style.userInfoStyle}>

                            <Text style={style.userNameTextStyle}>User Name</Text>

                            <Text style={style.userHashTagTextStyle}>#userHashTag</Text>

                        </View>

                        <View>

                            <QrCodeIcon width={moderateScale(45)} height={moderateVerticalScale(45)} />

                        </View>

                    </View>

                    <View style={style.addTagFieldContainerStyle}>

                        <TextInput
                            style={style.fieldInputStyle}
                            placeholder="Add #Tag"
                            placeholderTextColor={blackText}
                            selectionHandleColor={cursorColor}
                            cursorColor={cursorColor}
                            autoCorrect={false}
                            maxLength={50}
                            submitBehavior="blurAndSubmit"
                            value={tag}
                            onChangeText={(updateHashTag: string) => setTag(updateHashTag)} />

                    </View>

                    <Text style={style.favoritesLabelTextStyle}>Your Favourites</Text>

                    <FlashList
                        contentContainerStyle={style.tagsListContainerStyle}
                        data={undefined}
                        renderItem={undefined} />

                    <Pressable
                        style={({ pressed }) => [style.addTagButton, { backgroundColor: pressed ? pressedPrimaryButtonBackground : primaryButtonBackground }]}>

                        <AddIcon width={moderateScale(15)} height={moderateVerticalScale(15)} />

                    </Pressable>

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
    },
    userInfoContainerStyle: {
        flexDirection: 'row',
        paddingHorizontal: moderateScale(20),
        alignItems: 'center'
    },
    userInfoStyle: {
        flex: 1,
        justifyContent: 'center'
    },
    userNameTextStyle: {
        fontFamily: Platform.select({ ios: "Inter 18pt", android: "Inter_Regular" }),
        fontWeight: Platform.select({ ios: "400" }),
        fontSize: moderateScale(20),
        color: text
    },
    userHashTagTextStyle: {
        fontFamily: Platform.select({ ios: "Inter 18pt", android: "Inter_Regular" }),
        fontWeight: Platform.select({ ios: "400" }),
        fontSize: moderateScale(13),
        color: secondaryText,
        marginTop: moderateVerticalScale(2.5)
    },
    addTagFieldContainerStyle: {
        height: moderateVerticalScale(40),
        backgroundColor: whiteFieldContainerBackground,
        borderRadius: moderateScale(5),
        marginVertical: moderateVerticalScale(30),
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
    favoritesLabelTextStyle: {
        fontFamily: Platform.select({ ios: "Inter 18pt", android: "Inter_Regular" }),
        fontWeight: Platform.select({ ios: "400" }),
        fontSize: moderateScale(14),
        color: text,
        marginStart: moderateScale(40)
    },
    tagsListContainerStyle: {

    },
    addTagButton: {
        width: moderateScale(75),
        height: moderateVerticalScale(37),
        backgroundColor: primaryButtonBackground,
        borderRadius: moderateScale(5),
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: moderateVerticalScale(10)
    }
});

export default UserLibraryScreen;