import { useEffect } from 'react';
import { router } from 'expo-router';
import { useGetCurrentUserQuery, useLogoutMutation } from '../store/api/authApi';

export const useAuth = () => {
  const { data: user, isLoading, refetch } = useGetCurrentUserQuery();
  const [logout] = useLogoutMutation();

  useEffect(() => {
    // Refetch user data when app loads
    refetch();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user || true, //had to remove the true
    logout: handleLogout,
  };
};