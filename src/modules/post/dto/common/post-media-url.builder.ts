/** Resolves the public URL of a post media, or undefined when it cannot be computed. */
export interface PostMediaUrlBuilder {
  forPostMedia(fileId: string): string | undefined;
}
