/**
 * WebSocket event names emitted by ws-service, copied from the *WebsocketMessagingType enums of
 * @volontariapp/messaging (not a direct dependency of api-gateway; source:
 * npm-packages/packages/messaging/src/websockets/{users,posts,events,storage}/types.ts).
 */
export const WS_EVENTS = {
  USER_CREATED: 'user.created',
  USER_DELETED: 'user.deleted',
  USER_DELETION_FAILED: 'user.deletion_failed',
  USER_BADGE_AWARDED: 'user.badge_awarded',
  POST_CREATED: 'post.created',
  POST_DELETED: 'post.deleted',
  COMMENT_CREATED: 'post.comment.created',
  COMMENT_DELETED: 'post.comment.deleted',
  POST_LIKED: 'post.liked',
  POST_UNLIKED: 'post.unliked',
  EVENT_CREATED: 'event.created',
  EVENT_DELETED: 'event.deleted',
  EVENT_DELETION_FAILED: 'event.deletion_failed',
} as const;

/** `isEmitter` is set by ws-service on interaction notifications (likes, comments). */
export interface EmitterAwarePayload {
  isEmitter?: boolean;
}
