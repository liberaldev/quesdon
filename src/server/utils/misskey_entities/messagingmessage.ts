import { User } from './user';
import { UserGroup } from './usergroup';
import { DriveFile } from './drivefile';

export type MessagingMessage = 
{
	id: string;
	createdAt: string;
	userId: string;
	user?: User;
	text: string | null;
	fileId?: string | null;
	file?: DriveFile | null;
	recipientId: string | null;
	recipient?: User | null;
	groupId: string | null;
	group?: UserGroup | null;
	isRead?: boolean;
	reads?: Array<string>;
}