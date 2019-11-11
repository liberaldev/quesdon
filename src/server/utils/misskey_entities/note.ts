import { User } from './user';
import { DriveFile } from './drivefile';

export type Note = 
{
	id: string;
	createdAt: string;
	text: string | null;
	cw?: string | null;
	userId: string;
	user: User;
	replyId?: string | null;
	renoteId?: string | null;
	reply?: Note | null;
	renote?: Note | null;
	viaMobile?: boolean;
	isHidden?: boolean;
	visibility: string;
	mentions?: Array<string>;
	visibleUserIds?: Array<string>;
	fileIds?: Array<string>;
	files?: Array<DriveFile>;
	tags?: Array<string>;
	poll?: object | null; // FIXME: poll
	geo?: object | null; // FIXME: geo
}