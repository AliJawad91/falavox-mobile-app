// tokenService.js
import Keychain from 'react-native-keychain';

class TokenService {
  // Save both tokens
  static async setTokens(accessToken:string, refreshToken:string) {
    try {
      // Store separately with unique service names
      await Keychain.setGenericPassword('accessToken', accessToken, {
        service: 'accessToken'
      });
      await Keychain.setGenericPassword('refreshToken', refreshToken, {
        service: 'refreshToken'
      });
    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw error;
    }
  }

  // Get access token
  static async getAccessToken() {
    try {
      const credentials = await Keychain.getGenericPassword({ 
        service: 'accessToken' 
      });
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  // Get refresh token
  static async getRefreshToken() {
    try {
      const credentials = await Keychain.getGenericPassword({ 
        service: 'refreshToken' 
      });
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  // Clear all tokens (logout)
  static async clearTokens() {
    try {
      await Keychain.resetGenericPassword({ service: 'accessToken' });
      await Keychain.resetGenericPassword({ service: 'refreshToken' });
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // Check if user is logged in
  static async isLoggedIn() {
    const refreshToken = await this.getRefreshToken();
    return !!refreshToken;
  }
}

export default TokenService;