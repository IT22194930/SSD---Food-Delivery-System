import { useQuery } from "@tanstack/react-query";
import useAuth from "./useAuth";
import useAxiosSecure from "./useAxiosSecure";
// import { getCurrentUser } from '../utils/auth';

const useUser = () => {
  const { user, userId, userRole } = useAuth();
  const axiosSecure = useAxiosSecure();

  // Get user email from context
  const userEmail = user?.email;

  const {
    data: currentUser,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user", userEmail],
    queryFn: async () => {
      // If we have userId, fetch from API
      if (userId) {
        const res = await axiosSecure.get(`/api/auth/users/${userId}`);
        return res.data;
      }
      return null;
    },
    enabled: !!userId && !!localStorage.getItem("token"),
  });

  return { currentUser, isLoading, refetch };
};

export default useUser;
