import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Platform, Modal, TouchableWithoutFeedback, Pressable, StatusBar, StyleSheet, Text, TextInput, View, Animated } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../../App";
import { blackText, bottomGradientColor, cursorColor, icon, pressedIconButtonBackground, pressedPrimaryButtonBackground, primaryButtonBackground, secondaryText, text, topGradientColor, whiteFieldContainerBackground } from "../utils/colors";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import BackIcon from "../../assets/icons/ic_back_plain.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import MoreIcon from "../../assets/icons/ic_more.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import ProfileIcon from "../../assets/icons/ic_profile.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import SettingsIcon from "../../assets/icons/ic_settings.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import LogoutIcon from "../../assets/icons/ic_logout.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import QrCodeIcon from "../../assets/icons/ic_qr_code.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import AddIcon from "../../assets/icons/ic_add.svg";

// import { FlashList } from "@shopify/flash-list";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import UsersList from "../components/UsersList";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { logoutUser } from "../features/auth/authSlice";
import { clearMe, getMe } from "../features/userProfile/userProfileSlice";
import { fetchFavorites, resetFavoritesState } from "../features/favorites/favoritesSlice";
import { resetUsersState } from "../features/users/usersSlice";
import { persistor } from "../store";
import FavoritesList from "../components/FavoritesList";

type Props = NativeStackScreenProps<RootStackParamList, 'UserLibrary'>;

function UserLibraryScreen({ navigation }: Props) {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownAnimation = useRef(new Animated.Value(0)).current;
    const dropdownButtonRef = useRef<View>(null);
    const [showUserList, setShowUserList] = useState<boolean>(false);

    const userProfile = useAppSelector((state) => state.userProfile);
    // console.log(userProfile, "userProfile");

    const dispatch = useAppDispatch();

    useLayoutEffect(() => {
        StatusBar.setBarStyle('light-content');
    }, []);

    const handleBackPress = () => {
        navigation.goBack();
    };

    const toggleDropdown = () => {
        if (showDropdown) {
            // Close dropdown
            Animated.timing(dropdownAnimation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => setShowDropdown(false));
        } else {
            // Open dropdown
            setShowDropdown(true);
            Animated.timing(dropdownAnimation, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    };

    const handleLogoutPress = async () => {
        toggleDropdown();
        // Handle logout logic here
        // console.log('Logout pressed');
        // Clear all user-related state
        dispatch(logoutUser());
        dispatch(clearMe());
        dispatch(resetFavoritesState()); // Clear favorites
        dispatch(resetUsersState()); // Clear users list
        // Purge persisted storage for all user-related slices
        try {
            await persistor.purge();
        } catch (error) {
            console.error('Error purging persisted storage:', error);
        }
        navigation.navigate('Welcome');
    };

    const handleBackdropPress = () => {
        toggleDropdown();
    };

    const dropdownTranslateY = dropdownAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-10, 0],
    });

    const dropdownOpacity = dropdownAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const handleMorePress = () => {
        if (dropdownButtonRef.current) {
            dropdownButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
                toggleDropdown();
            });
        } else {
            toggleDropdown();
        }
    };
    // const me = useAppSelector((state) => state.userProfile.profile);
    const accessToken = useAppSelector((state => state.auth.tokens?.accessToken));
    // console.log(accessToken,"accessToken");


    // Refetch favorites when returning from UsersList
    useEffect(() => {
        if (!showUserList) {
            // When showUserList becomes false (i.e., we're showing FavoritesList), refetch favorites
            // console.log("Refetching favorites after returning from UsersList");
            dispatch(fetchFavorites({ page: 1, limit: 50 }));
        }
    }, [showUserList, dispatch]);


    return (
        <LinearGradient
            style={style.gradientContainerStyle}
            colors={[topGradientColor, bottomGradientColor]}
            locations={[0, 0.5]}>

            <SafeAreaView style={style.safeAreaStyle}>

                <View style={style.headerStyle}>

                    {/* Empty View to balance the header */}
                    <View style={style.headerPlaceholder} />

                    {/* More button on the right */}
                    <View ref={dropdownButtonRef}>
                        <Pressable
                            style={({ pressed }) => [
                                pressed ? style.pressedHeaderButtonStyle : style.headerButtonStyle,
                                { marginStart: moderateScale(10) }
                            ]}
                            onPress={handleMorePress}>

                            <MoreIcon style={{ color: icon }}
                                width={moderateScale(25)} height={moderateVerticalScale(25)} />

                        </Pressable>
                    </View>

                </View>

                <View style={style.contentStyle}>

                    <View style={style.userInfoContainerStyle}>

                        <View style={style.userInfoStyle}>

                            <Text style={style.userNameTextStyle}>My Voice ID : {userProfile?.profile?.userName}</Text>

                            {/* <Text style={style.userHashTagTextStyle}>My Voice ID : {userProfile?.profile?.userName}</Text> */}

                        </View>

                        {/* <View>

                            <QrCodeIcon width={moderateScale(45)} height={moderateVerticalScale(45)} />

                        </View> */}

                    </View>

                    {showUserList ? (
                        <UsersList onUserAdded={() => setShowUserList(false)} onBack={() => setShowUserList(false)} />
                    ) : (
                        <FavoritesList onShowUserList={() => setShowUserList(true)} />
                    )}
                    {/* <Pressable
                        style={({ pressed }) => [style.addTagButton, { backgroundColor: pressed ? pressedPrimaryButtonBackground : primaryButtonBackground }]}>

                        <AddIcon width={moderateScale(15)} height={moderateVerticalScale(15)} />

                    </Pressable> */}

                </View>

                {/* Dropdown Modal */}
                <Modal
                    visible={showDropdown}
                    transparent={true}
                    animationType="none"
                    onRequestClose={toggleDropdown}
                >
                    <TouchableWithoutFeedback onPress={handleBackdropPress}>
                        <View style={style.modalOverlay}>
                            <Animated.View
                                style={[
                                    style.dropdownContainer,
                                    {
                                        top: moderateVerticalScale(60), // Position below header
                                        right: moderateScale(20),
                                        opacity: dropdownOpacity,
                                        transform: [{ translateY: dropdownTranslateY }]
                                    }
                                ]}
                            >
                                <View style={style.dropdownMenu}>

                                    {/* Divider */}
                                    {/* <View style={style.dropdownDivider} /> */}

                                    {/* Logout Option */}
                                    <Pressable
                                        style={({ pressed }) => [
                                            style.dropdownItem,
                                            pressed && style.dropdownItemPressed
                                        ]}
                                        onPress={handleLogoutPress}
                                    >
                                        <Text style={[style.dropdownText, style.logoutText]}>🚪 Logout</Text>
                                    </Pressable>
                                </View>
                            </Animated.View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

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
    headerPlaceholder: {
        width: moderateScale(45), // Same width as the button for balance
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
        justifyContent: 'center',
        padding: 10
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
    profilePicContainer: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        overflow: 'hidden',
        backgroundColor: '#ddd', // Placeholder color
    },
    profilePic: {
        width: '100%',
        height: '100%',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    dropdownContainer: {
        position: 'absolute',
        minWidth: moderateScale(180),
        borderRadius: moderateScale(12),
        backgroundColor: whiteFieldContainerBackground,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dropdownMenu: {
        paddingVertical: moderateVerticalScale(8),
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateVerticalScale(12),
    },
    dropdownItemPressed: {
        backgroundColor: pressedIconButtonBackground,
    },
    dropdownIcon: {
        marginRight: moderateScale(12),
        color: icon,
    },
    dropdownText: {
        fontFamily: Platform.select({ ios: "Inter 18pt", android: "Inter_Regular" }),
        fontWeight: Platform.select({ ios: "400" }),
        fontSize: moderateScale(16),
        color: text,
    },
    logoutText: {
        color: '#FF3B30', // Red color for logout to indicate destructive action
    },
    dropdownDivider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: moderateVerticalScale(4),
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
    },
    container: {
        flex: 1,
        paddingTop: 20,
        backgroundColor: '#f0f0f0',
    },
    item: {
        backgroundColor: '#ffffff',
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#555',
    },
});

export default UserLibraryScreen;