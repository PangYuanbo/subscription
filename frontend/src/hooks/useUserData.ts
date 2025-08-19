import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';

export function useUserData() {
  const { user, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (isAuthenticated && user) {
      const userKey = `user_${user.sub}`;
      const existingData = localStorage.getItem(userKey);
      
      if (!existingData) {
        localStorage.setItem(userKey, JSON.stringify({
          userId: user.sub,
          email: user.email,
          name: user.name,
          picture: user.picture,
          createdAt: new Date().toISOString(),
        }));
      }
    }
  }, [isAuthenticated, user]);

  const getUserDataKey = (key: string) => {
    if (!user?.sub) return key;
    return `${user.sub}_${key}`;
  };

  const getUserData = (key: string) => {
    const userKey = getUserDataKey(key);
    return localStorage.getItem(userKey);
  };

  const setUserData = (key: string, value: any) => {
    const userKey = getUserDataKey(key);
    if (typeof value === 'object') {
      localStorage.setItem(userKey, JSON.stringify(value));
    } else {
      localStorage.setItem(userKey, value);
    }
  };

  const removeUserData = (key: string) => {
    const userKey = getUserDataKey(key);
    localStorage.removeItem(userKey);
  };

  return {
    user,
    isAuthenticated,
    getUserData,
    setUserData,
    removeUserData,
    getUserDataKey,
  };
}