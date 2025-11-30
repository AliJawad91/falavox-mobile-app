// src/features/favorites/components/FavoritesList.tsx
import React, {
  useCallback,
  useRef,
  useEffect
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
import { useFocusEffect } from '@react-navigation/native';
import { moderateScale, moderateVerticalScale } from 'react-native-size-matters';

import { User } from '../types/api'; // Import from your existing types
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  fetchFavorites,
  toggleFavorite,
} from '../features/favorites/favoritesSlice';
import {
  blackText,
  primaryButtonBackground,
} from '../utils/colors';

interface FavoritesListProps {
  onShowUserList?: () => void;
}
// const FavoritesList: React.FC = () => {
const FavoritesList: React.FC<FavoritesListProps> = ({ onShowUserList }) => {

  const dispatch = useAppDispatch();
  const listRef = useRef<any>(null);
  const shouldScrollToTop = useRef<boolean>(false);

  const {
    favorites,
    isLoading,
    pagination,
    error
  } = useAppSelector(state => state.userFavorites);

  console.log(favorites, "favorites items");

  // Load initial favorites on mount
  useEffect(() => {
    console.log("fetchFavorites useEffect");
    
    dispatch(fetchFavorites({ page: 1, limit: 50 }));
  }, [dispatch]);

  // Refetch favorites when component comes into focus (e.g., when navigating back from UsersList)
  useFocusEffect(
    useCallback(() => {
      shouldScrollToTop.current = true; // Mark that we should scroll after refetch
      dispatch(fetchFavorites({ page: 1, limit: 50 }));
    }, [dispatch])
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

    if (isLoading || !pagination.hasMore) return;

    const nextPage = pagination.currentPage + 1;
    dispatch(fetchFavorites({
      page: nextPage,
      limit: 50
    }));
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

  const renderItem = useCallback(({ item }: { item: User }) => (
    <FavoriteItem user={item} onRemove={handleRemoveFavorite} />
  ), [handleRemoveFavorite]);

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
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoading ? (
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
}

const FavoriteItem: React.FC<FavoriteItemProps> = React.memo(({ user, onRemove }) => (

  <View style={styles.favoriteItem}>
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
      // onPress={() => onRemove(user)}
    >
      <Text style={styles.callButtonText}>CAll</Text>
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

// Styles remain the same...
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
  callButton:{
    margin:10,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(6),
    backgroundColor: '#ebffee',
    borderRadius: moderateScale(4),
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
    marginHorizontal:130,
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
});

export default FavoritesList;