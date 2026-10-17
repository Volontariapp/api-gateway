/** Computes the public URL of an event cover photo from its file id. */
export interface EventCoverUrlBuilder {
  forEventCover(fileId?: string): string | undefined;
}
