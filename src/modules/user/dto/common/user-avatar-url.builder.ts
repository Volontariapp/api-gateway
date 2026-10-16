/** Resolves the public URL of a user avatar, or undefined when there is nothing to expose. */
export interface UserAvatarUrlBuilder {
  forUserAvatar(avatarFileId?: string): string | undefined;
}
