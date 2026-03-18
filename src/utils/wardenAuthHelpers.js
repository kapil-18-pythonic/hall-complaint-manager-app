import { wardens } from "../data/wardens";

export const findWardenByCredentials = (email, password) => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  return wardens.find(
    (warden) =>
      warden.email.toLowerCase() === cleanEmail &&
      warden.password === cleanPassword
  );
};