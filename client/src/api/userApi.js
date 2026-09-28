import api from "./axios";

/*
 * Generic authenticated user directory.
 */
export const getUsers = (role) => {
  const params = role ? { role } : {};

  return api.get("/users", {
    params,
  });
};

export const getUserById = (id) => {
  return api.get(`/users/${id}`);
};

/*
 * Current authenticated account.
 */
export const getCurrentUser = () => {
  return api.get("/auth/me");
};
