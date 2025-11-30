// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from '../features/auth/authSlice';
import usersReducer from '../features/users/usersSlice'
import userProfileReducer from '../features/userProfile/userProfileSlice'
import userFavoritesReducer from '../features/favorites/favoritesSlice'
// Persist config for auth
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'tokens', 'isAuthenticated'],
};

const usersPersistConfig = {
  key: 'users',
  storage: AsyncStorage,
  whitelist: ['items'], // Only persist the users items, not loading states
  // Or blacklist loading states if you want to persist everything except loading
  // blacklist: ['loading', 'searchLoading']
};
const userProfilePersistConfig = {
  key: 'userProfile',
  storage: AsyncStorage,
  whitelist: ['profile'], // Only persist the users items, not loading states
  // Or blacklist loading states if you want to persist everything except loading
  // blacklist: ['loading', 'searchLoading']
};
const userFavoritesPersistConfig = {
  key: 'userFavorites',
  storage: AsyncStorage,
  whitelist: ['favorites'], // Only persist the users items, not loading states
  // Or blacklist loading states if you want to persist everything except loading
  // blacklist: ['loading', 'searchLoading']
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedUsersReducer = persistReducer(usersPersistConfig, usersReducer);
const persistedUserProfileReducer = persistReducer(userProfilePersistConfig, userProfileReducer);
const persistedUserFavoritesReducer = persistReducer(userFavoritesPersistConfig, userFavoritesReducer);


// Configure store
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    users: persistedUsersReducer,
    userProfile : persistedUserProfileReducer,
    userFavorites: persistedUserFavoritesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Define types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;