// client/src/utils/roleGuard.js
import { ROLES } from "./constants";

export const canCreateEvent = (user) =>
  [ROLES.CLUB, ROLES.ADMIN].includes(user?.role);

export const canCreateClub = (user) =>
  [ROLES.CLUB, ROLES.ADMIN].includes(user?.role);

export const canModerate = (user) =>
  user?.role === ROLES.ADMIN;

export const isClubAdmin = (club, userId) => {
  if (!club || !userId) return false;
  return club.admin?._id === userId || club.admin === userId;
};

export const isClubMember = (club, userId) => {
  if (!club || !userId) return false;
  return club.members?.some(
    (m) => (m.user?._id ?? m.user) === userId && m.status === "active"
  );
};