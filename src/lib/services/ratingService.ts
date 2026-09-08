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
    return {
      displayName: '?',
      displayImageUrl: null,
    };
  }

  if (user.privacyMode === 'anonymous') {
    return {
      displayName: 'Anonymous',
      displayImageUrl: null,
    };
  }

  // Public/Alias Mode
  const username = user.username?.trim();
  if (!username) {
    return {
      displayName: '?',
      displayImageUrl: null, // Don't show image if username is missing to match '?' privacy fallback
    };
  }

  return {
    displayName: `@${username}`,
    displayImageUrl: user.profileImageUrl || null,
  };
}
