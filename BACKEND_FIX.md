# Backend Fix for Alphabetical Sorting of Favorites

## Issue
The favorites list is currently sorted by `createdAt: -1` (newest first), but it should be sorted alphabetically by `userName` (A-Z).

## Solution
Update the `getUserFavorites` method in `src/services/favoriteService.js` to sort by `userName` alphabetically.

## Code Change

Replace the `getUserFavorites` method in `src/services/favoriteService.js`:

**Before:**
```javascript
async getUserFavorites(userId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const [favorites, total] = await Promise.all([
    Favorite.find({ user: userId })
      .populate('favoriteUser', 'firstName lastName userName profile.avatarUrl')
      .sort({ createdAt: -1 })  // ❌ Sorts by creation date (newest first)
      .skip(skip)
      .limit(limit)
      .lean(),
    Favorite.countDocuments({ user: userId })
  ]);

  return {
    favorites: favorites.map(fav => fav.favoriteUser),
    pagination: { page, limit, total, hasMore: page * limit < total }
  };
}
```

**After:**
```javascript
async getUserFavorites(userId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const [favorites, total] = await Promise.all([
    Favorite.find({ user: userId })
      .populate('favoriteUser', 'firstName lastName userName profile.avatarUrl')
      .lean(),
    Favorite.countDocuments({ user: userId })
  ]);

  // Sort by userName alphabetically (A-Z) after populating
  const sortedFavorites = favorites
    .map(fav => fav.favoriteUser)
    .filter(user => user !== null) // Filter out any null populated users
    .sort((a, b) => {
      const userNameA = (a.userName || '').toLowerCase();
      const userNameB = (b.userName || '').toLowerCase();
      return userNameA.localeCompare(userNameB);
    });

  // Apply pagination after sorting
  const paginatedFavorites = sortedFavorites.slice(skip, skip + limit);

  return {
    favorites: paginatedFavorites,
    pagination: { 
      page, 
      limit, 
      total, 
      hasMore: skip + limit < total 
    }
  };
}
```

## Alternative: Using Aggregation Pipeline (More Efficient for Large Datasets)

If you have a large number of favorites, you might want to use an aggregation pipeline for better performance:

```javascript
async getUserFavorites(userId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const [favoritesResult, total] = await Promise.all([
    Favorite.aggregate([
      { $match: { user: userId } },
      {
        $lookup: {
          from: 'users',
          localField: 'favoriteUser',
          foreignField: '_id',
          as: 'favoriteUser'
        }
      },
      { $unwind: '$favoriteUser' },
      {
        $project: {
          'favoriteUser.firstName': 1,
          'favoriteUser.lastName': 1,
          'favoriteUser.userName': 1,
          'favoriteUser.profile.avatarUrl': 1
        }
      },
      { $sort: { 'favoriteUser.userName': 1 } }, // Sort alphabetically
      { $skip: skip },
      { $limit: limit }
    ]),
    Favorite.countDocuments({ user: userId })
  ]);

  return {
    favorites: favoritesResult.map(item => item.favoriteUser),
    pagination: { 
      page, 
      limit, 
      total, 
      hasMore: skip + limit < total 
    }
  };
}
```

## Recommendation
- Use the **first solution** (sorting in memory) if you expect users to have a reasonable number of favorites (< 1000)
- Use the **aggregation pipeline** if you expect users to have many favorites and need better performance

After making this change, restart your backend server and the favorites list will be sorted alphabetically by `userName`.

