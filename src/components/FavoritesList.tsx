// src/features/favorites/components/FavoritesList.tsx
import React, {
  useCallback,
  useRef,
  useEffect,
  useState
} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { moderateScale, moderateVerticalScale } from 'react-native-size-matters';

import { TokenApiResponse, User } from '../types/api'; // Import from your existing types
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  fetchFavorites,
  toggleFavorite,
} from '../features/favorites/favoritesSlice';
import {
  blackText,
  primaryButtonBackground,
} from '../utils/colors';
import { RootStackParamList } from '../../App';
import { APP_CONFIG, fetchWithTimeout, withBase } from '../config';
import { logger } from '../utils/logger';
import { getMe } from '../features/userProfile/userProfileSlice';

interface FavoritesListProps {
  onShowUserList?: () => void;
  // navigation: NavigationProp<RootStackParamList, 'UserLibrary'>;

}
// const FavoritesList: React.FC = () => {
const FavoritesList: React.FC<FavoritesListProps> = ({ onShowUserList }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const dispatch = useAppDispatch();
  const listRef = useRef<any>(null);
  const [callJoinLoading, setCallJoinLoading] = useState(false);

  const shouldScrollToTop = useRef<boolean>(false);

  const {
    favorites,
    isLoading,
    pagination,
    error
  } = useAppSelector(state => state.userFavorites);
  const me = useAppSelector(state => state.userProfile.profile);

  useEffect(() => {
    if (me?.id) {
      dispatch(fetchFavorites({ page: 1, limit: 50 }));
    }
  }, [me?.id, dispatch]);
  useEffect(() => {
    console.log("get Me");

    dispatch(getMe());
  }, [])
  useFocusEffect(
    useCallback(() => {
      if (me?.id) {
        shouldScrollToTop.current = true;
        dispatch(fetchFavorites({ page: 1, limit: 50 }));
      }
    }, [dispatch, me?.id])
  );

  // Scroll to top when favorites are loaded after refetch (e.g., after adding a new favorite)
  useEffect(() => {
    if (!isLoading && favorites.length > 0 && listRef.current && shouldScrollToTop.current) {
      // Small delay to ensure the list has rendered
      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
        shouldScrollToTop.current = false; // Reset the flag
      }, 100);
    }
  }, [favorites, isLoading]);

  // Load more data
  const loadMore = useCallback(() => {
    if (me?.id) {

      if (isLoading || !pagination.hasMore) return;

      const nextPage = pagination.currentPage + 1;
      dispatch(fetchFavorites({
        page: nextPage,
        limit: 50
      }));
    }
  }, [isLoading, pagination, dispatch]);

  // Remove favorite with confirmation
  const handleRemoveFavorite = useCallback((user: User) => {
    Alert.alert(
      'Remove Favorite',
      `Remove ${user.firstName} ${user.lastName} from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // toggleFavorite.fulfilled will handle the removal and count update
            dispatch(toggleFavorite(user.id));
          }
        }
      ]
    );
  }, [dispatch]);

  // Utility function to generate consistent channel name
  const generateChannelName = (user1: string, user2: string) => {
    const users = [user1, user2].sort(); // Sort alphabetically
    return `${users[0]}_${users[1]}`;
  };

  const generateToken = async (channelName: string,) => {
    try {
      setCallJoinLoading(true);
      // const url = withBase(`${APP_CONFIG.TOKEN_ENDPOINT}?channel=${encodeURIComponent(channelName)}`);
      const uid = me?.agoraId;       // <-- pass this in API
      console.log(typeof uid, "typeee");

      if (!uid) throw new Error("Agora UID not found");

      const url = withBase(
        `${APP_CONFIG.TOKEN_ENDPOINT}?channel=${encodeURIComponent(channelName)}&uid=${uid}`
      );

      const res = await fetchWithTimeout(url, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeoutMs: APP_CONFIG.REQUEST_TIMEOUT_MS,
      });
      // logger.debug('Token response status', res.status);

      if (!res.ok) throw new Error('Token request failed');
      const { data } = (await res.json()) as TokenApiResponse; // { token, uid, channel, expiresAt }
      // logger.debug('Token data', data);
      console.log('Token data', data);

      setCallJoinLoading(false);
      if (!data.token) throw new Error("Unsuccessfull Token Generation .");
      //get user id
      return data;
      // navigation.navigate('Call', {
      //   channel: channelName,
      //   // language,
      //   channelTokenData: data,
      //   uid: me?.agoraId || Number(data.uid),
      //   // uid: Number(data.uid),
      //   expiresAt: data.expiresAt,
      // });
    } catch (err: any) {
      setCallJoinLoading(false);
      logger.error('Join error', err);
      Alert.alert('Error', err?.message ?? 'Failed to join. Check your network and try again.');
    }
  }
  const makeCall = async (user: User) => {
    try {
      if (!me) {
        Alert.alert('Profile not loaded', 'Your profile information is not available yet. Please try again in a moment.');
        return;
      }
      console.log(me, "meeee");
      const availableMinutes = me.wallet?.call?.availableMinutes ?? 0;
      const totalUsedMinutes = me.wallet?.call?.totalUsedMinutes ?? 0;
      console.log("Minutes availbility", { availableMinutes: availableMinutes, totalUsedMinutes: totalUsedMinutes });

      if (availableMinutes <= totalUsedMinutes || totalUsedMinutes > availableMinutes) {
        return Alert.alert(
          'We Appologie`s',
          ` ${user.userName}, You Dont have enough minutes available to make this call. Kindly purchase more minutes`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Purchase Now',
              onPress: () => navigation.navigate('Purchase')
            },
          ]
        );
      }

      const channelName = generateChannelName(
        me.userName.toLowerCase(),
        user.userName.toLowerCase()
      );
      const tokenData = await generateToken(channelName)
      if (!tokenData) throw new Error("Token not generated");
      console.log("CALLLL", tokenData);

      navigation.navigate('CallUI', {
        channel: channelName,
        // language,
        calledUser: user,
        channelTokenData: tokenData,
        uid: me?.agoraId || Number(tokenData.uid),
        // uid: Number(data.uid),
        expiresAt: tokenData.expiresAt,
      });
    } catch (error) {

    }
  }
  // Handle making a call to a favorite user
  const handleMakeCall = useCallback(
    (user: User) => {
      if (!me?.userName) {
        Alert.alert('Profile not loaded', 'Your profile information is not available yet. Please try again in a moment.');
        return;
      }
      Alert.alert(
        'Make A Call',
        `Do you want to make a call with ${user.userName} ?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Call',
            onPress: () => { makeCall(user) }
          },
        ]
      );
    },
    [me, navigation]
  );


  const renderItem = useCallback(
    ({ item }: { item: User }) => (
      <FavoriteItem
        user={item}
        onRemove={handleRemoveFavorite}
        onMakeCall={handleMakeCall}
        callJoinLoading={callJoinLoading}
      />
    ),
    [handleRemoveFavorite, handleMakeCall, callJoinLoading]
  );

  const keyExtractor = useCallback((item: User) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Favorites</Text>

        <Text style={styles.headerSubtitle}>
          {pagination.totalFavorites} users
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity onPress={() => dispatch(fetchFavorites({ page: 1, limit: 50 }))}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FlashList */}
      <FlashList
        ref={listRef}
        data={favorites}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        //   estimatedItemSize={80}
        onEndReached={callJoinLoading ? undefined : loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoading && !callJoinLoading ? (
            <ActivityIndicator style={styles.footerLoader} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Favorites Yet</Text>
              <Text style={styles.emptySubtitle}>
                Users you add to favorites will appear here
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={favorites.length === 0 ? styles.emptyListContent : undefined}
      />
      {/* Global loader overlay while joining a call */}
      {callJoinLoading && (
        <View style={styles.globalLoaderOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.globalLoaderText}>Joining call…</Text>
        </View>
      )}
      {onShowUserList && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={onShowUserList}
        >
          <Text style={styles.addButtonText}>Add Users</Text>
        </TouchableOpacity>
      )}

    </View>
  );
};

// Favorite Item Component - using User type
interface FavoriteItemProps {
  user: User;
  onRemove: (user: User) => void;
  onMakeCall: (user: User) => void;
  callJoinLoading: boolean;
}

const FavoriteItem: React.FC<FavoriteItemProps> = React.memo(({ user, onRemove, onMakeCall, callJoinLoading }) => (
  <View style={styles.favoriteItem} pointerEvents={callJoinLoading ? 'none' : 'auto'}>
    <View style={styles.userInfo}>
      {/* Avatar/Initials */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.firstName?.[0]}{user.lastName?.[0]}
        </Text>
      </View>

      {/* User Details */}
      <View style={styles.userDetails}>
        <Text style={styles.userName}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.userHandle}>@{user.userName}</Text>

      </View>
    </View>
    <TouchableOpacity
      style={styles.callButton}
      disabled={callJoinLoading}
      onPress={() => !callJoinLoading && onMakeCall(user)}
    >
      <Text style={styles.callButtonText}>
        {callJoinLoading ? 'Joining…' : 'Call'}
      </Text>
    </TouchableOpacity>
    {/* Remove Button */}
    <TouchableOpacity
      style={styles.removeButton}
      onPress={() => onRemove(user)}
    >
      <Text style={styles.removeButtonText}>Remove</Text>
    </TouchableOpacity>
  </View>

));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: moderateScale(25),
  },
  header: {
    paddingVertical: moderateVerticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: moderateVerticalScale(10),
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: blackText,
    marginBottom: moderateVerticalScale(5),
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    color: '#666',
    marginBottom: moderateVerticalScale(10),
  },
  clearButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(6),
    backgroundColor: '#ffebee',
    borderRadius: moderateScale(4),
  },
  clearButtonText: {
    color: '#d32f2f',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  errorContainer: {
    padding: moderateScale(10),
    backgroundColor: '#ffebee',
    borderRadius: moderateScale(5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateVerticalScale(10),
  },
  errorText: {
    color: '#d32f2f',
    fontSize: moderateScale(14),
    flex: 1,
  },
  retryText: {
    color: '#1976d2',
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  footerLoader: {
    padding: moderateScale(20),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateVerticalScale(50),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#666',
    marginBottom: moderateVerticalScale(8),
  },
  emptySubtitle: {
    fontSize: moderateScale(14),
    color: '#999',
    textAlign: 'center',
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(15),
    borderRadius: moderateScale(8),
    marginBottom: moderateVerticalScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22, // Increased for better depth
    shadowRadius: 3.22,
    elevation: 5,
    // Optional: subtle border for glass edge
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  avatarText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: 'white',
    marginBottom: moderateVerticalScale(2),
  },
  userHandle: {
    fontSize: moderateScale(14),
    // color: '#666',
    color: 'white',
    marginBottom: moderateVerticalScale(2),
  },
  userJob: {
    fontSize: moderateScale(12),
    color: '#999',
    fontStyle: 'italic',
  },
  callButton: {
    margin: 10,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(6),
    backgroundColor: '#ebffee',
    borderRadius: moderateScale(4),
  },
  callButtonDisabled: {
    opacity: 0.6,
  },
  callButtonText: {
    color: '#2fd32f',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  removeButton: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(6),
    backgroundColor: '#ffebee',
    borderRadius: moderateScale(4),
  },
  removeButtonText: {
    color: '#d32f2f',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    marginHorizontal: 130,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
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
  globalLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  globalLoaderText: {
    marginTop: moderateVerticalScale(10),
    color: '#ffffff',
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
});

export default FavoritesList;