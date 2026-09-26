import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
} from "../api/userApi";

import {
  useAuth,
} from "./AuthContext";

const UserContext =
  createContext(null);

export function UserProvider({
  children,
}) {
  const {
    user: authUser,
  } = useAuth();

  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser =
      async () => {
        /*
         * No authenticated application user:
         * do not call protected /api/users.
         */
        if (!authUser) {
          if (!cancelled) {
            setUsers([]);
            setCurrentUser(null);
            setLoading(false);
          }

          return;
        }

        setLoading(true);

        try {
          const response =
            await getCurrentUser();

          const account =
            response.data?.user;

          if (
            !account ||
            cancelled
          ) {
            return;
          }

          const normalizedUser = {
            ...account,

            // Existing UI components expect _id.
            _id: String(
              account.id,
            ),
          };

          /*
           * Preserve the existing UserContext interface,
           * but do not download the full user directory
           * merely to determine who is logged in.
           */
          setUsers([
            normalizedUser,
          ]);

          setCurrentUser(
            normalizedUser,
          );
        } catch (error) {
          console.error(
            "Failed to load current authenticated user:",
            error,
          );

          if (!cancelled) {
            setUsers([]);
            setCurrentUser(null);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUser,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx =
    useContext(UserContext);

  if (!ctx) {
    throw new Error(
      "useUser must be used within UserProvider",
    );
  }

  return ctx;
}