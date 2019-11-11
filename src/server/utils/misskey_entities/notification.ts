import { User } from './user';

enum NotificationType // TODO: bring this out
{
	follow = 'follow',
	receiveFollowRequest = 'receiveFollowRequest',
	mention = 'mention',
	reply = 'reply',
	renote = 'renote',
	quote = 'quote',
	reaction = 'reaction',
	pollVote = 'pollVote'
}

export type Notification = 
{
	id: string;
	createdAt: string;
	type: NotificationType;
	userId?: string | null;
	user?: User | null;
}