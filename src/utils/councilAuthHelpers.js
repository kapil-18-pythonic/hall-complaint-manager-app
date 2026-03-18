import { councils } from "../data/councils";

export const findCouncilByCredentials = (name, roll) => {
  const cleanName = name.trim().toLowerCase();
  const cleanRoll = roll.trim();

  return councils.find(
    (member) =>
      member.name.toLowerCase() === cleanName &&
      member.roll === cleanRoll
  );
};