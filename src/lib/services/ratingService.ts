import { User } from '../types';

/**
 * Helper to determine how a user's identity should be displayed publicly
 */
export function getPublicSpotterIdentity(
  user: User
): {
  displayName: string;
  displayImageUrl: string | null;
} | null {
  if (!user || user.privacyMode === 'hidden') {
    return null; // Don't show identity
  }

  if (user.privacyMode === 'anonymous') {
    return {
      displayName: 'Anonymous',
      displayImageUrl: null,
    };
  }

  // Public/Alias Mode
  return {
    displayName: user.username ? `@${user.username}` : 'Spotter',
    displayImageUrl: user.profileImageUrl || null,
  };
}
