import { User } from './user';

export type NoteReaction = 
{
	id: string;
	createdAt: string;
	user: User;
	type: string;
}