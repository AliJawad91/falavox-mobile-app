// src/features/user/components/UserList.tsx
import React, {
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  TextInput,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { User } from '../types';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { clearSearch, fetchUsers, searchUsers, setSearchQuery } from '../features/users/usersSlice';
import { moderateScale, moderateVerticalScale } from 'react-native-size-matters';
import { blackText, cursorColor, whiteFieldContainerBackground } from '../utils/colors';
import { toggleFavorite, fetchFavorites } from '../features/favorites/favoritesSlice';

interface UsersListProps {
  onUserAdded?: () => void;
  onBack?: () => void;
}


const UsersList: React.FC<UsersListProps> = ({ onUserAdded, onBack }) => {
  
  const dispatch = useAppDispatch();
  const {
    users,
    isLoading,
    searchLoading,
    pagination,
    search,
    error
  } = useAppSelector(state => state.users);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounced search by userName
  const handleSearch = useCallback((query: string) => {
    dispatch(setSearchQuery(query));

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length === 0) {
      dispatch(clearSearch());
      dispatch(fetchUsers({ page: 1, limit: 50 }));
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      // Search by userName (which contains Voice IDs)
      dispatch(searchUsers({
        query,
        page: 1,
        limit: 50
      }));
    }, 500);
  }, [dispatch]);

  // // Load initial users
  useEffect(() => {
    dispatch(fetchUsers({ page: 1, limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    console.log("Users data check:", users.map(u => ({ id: u.id, userName: u.userName })));
  }, [users]);

  const handleAddFavorite = useCallback(async (userId: string) => {
    try {
      console.log("handleAddFavorite userId",userId);
      
      const result = await dispatch(toggleFavorite(userId)).unwrap();
      
      // If favorite was added, refetch favorites to get the sorted list from backend
      if (result?.response?.success && result?.response?.data?.action === 'added') {
        // Refetch favorites to get the alphabetically sorted list from backend
        dispatch(fetchFavorites({ page: 1, limit: 50 }));
      }
      
      // Call the callback if provided
      if (onUserAdded) {
        onUserAdded();
      }
    } catch (error) {
      console.log('Failed to add favorite:', error);
    }
  }, [dispatch, onUserAdded]);


  // // Load more data
  const loadMore = useCallback(() => {
    console.log("load More");

    if ((isLoading || searchLoading) || !pagination.hasMore) return;

    const nextPage = pagination.currentPage + 1;

    if (search.isSearching && search.query) {
      dispatch(searchUsers({
        query: search.query,
        page: nextPage,
        limit: 50
      }));
    } else {
      dispatch(fetchUsers({
        page: nextPage,
        limit: 50
      }));
    }
  }, [isLoading, searchLoading, pagination, search, dispatch]);

  const renderItem = useCallback(({ item }: { item: User }) => (

    <UserItem user={item} onAddFavorite={handleAddFavorite} />
  ), [handleAddFavorite]);

  const keyExtractor = useCallback((item: User) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Search Input - searches by userName (Voice IDs) */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Voice ID..."
          placeholderTextColor={blackText}
          selectionHandleColor={cursorColor}
          cursorColor={cursorColor}
          autoCorrect={false}
          maxLength={50}
          value={search.query}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />

        {searchLoading && (
          <View style={styles.searchLoader}>
            <ActivityIndicator size="small" />
          </View>
        )}
      </View>

      {/* Search Status */}
      {search.isSearching && (
        <View style={styles.searchStatus}>
          <Text style={styles.searchStatusText}>
            Searching Voice IDs for: "{search.query}"
          </Text>
          <TouchableOpacity
            onPress={() => dispatch(clearSearch())}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {/* FlashList */}
      <FlashList
        data={users}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        //   estimatedItemSize={80}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          (isLoading || searchLoading) ? (
            <ActivityIndicator style={styles.footerLoader} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading && !searchLoading ? (
            <View style={styles.emptyContainer}>
              <Text>
                {search.isSearching ? 'No users found' : 'No users available'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

// User Item Component - Displaying userName as Voice ID
interface UserItemProps {
  user: User;
  onAddFavorite: (userId: string) => void;
}

const UserItem: React.FC<UserItemProps> = React.memo(({ user, onAddFavorite }) => (
  <View style={styles.userItem}>
    <View style={styles.userInfo}>
      <Text style={styles.voiceId}>{user.userName}</Text>
      <Text style={styles.userEmail}>{user.email}</Text>
      <Text style={styles.userName}>
        {user.firstName} {user.lastName}
      </Text>
    </View>

    {/* Add Favorite Button */}
    <TouchableOpacity
      style={styles.addButton}
      onPress={() => 
        // console.log(user,"onpress")
        
        onAddFavorite(user.id)
      }
    >
      <Text style={styles.addButtonText}>Add</Text>
    </TouchableOpacity>
  </View>
));


const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: moderateScale(25),

  },
  searchContainer: {
    // padding: 10,
    // backgroundColor: 'white',

  },
  searchInput: {
    // height: 40,
    // borderColor: '#ddd',
    // borderWidth: 1,
    // borderRadius: 8,
    paddingHorizontal: 10,
    height: moderateVerticalScale(40),
    backgroundColor: whiteFieldContainerBackground,
    // borderRadius: moderateScale(5),
    borderTopEndRadius: moderateScale(5),
    borderTopLeftRadius: moderateScale(5),
    marginVertical: moderateVerticalScale(0),
    // marginHorizontal: moderateScale(25),
    alignItems: 'center'
  },
  searchLoader: {
    position: 'absolute',
    right: 40,
    top: 45,
  },
  searchStatus: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchStatusText: {
    fontSize: 14,
    color: '#666',
  },
  clearText: {
    color: 'blue',
    fontSize: 14,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: 'red',
  },
  footerLoader: {
    padding: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  // userItem: {
  //   height: 100,
  //   padding: 10,
  //   borderBottomWidth: 1,
  //   borderBottomColor: '#eee',
  // },
  voiceId: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#666',
  },
  userEmail: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  userName: {
    color: '#555',
    fontSize: 14,
    marginTop: 2,
  },
  userItem: {
    height: 100,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateVerticalScale(10),
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#6c757d',
    borderRadius: 4,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default UsersList;