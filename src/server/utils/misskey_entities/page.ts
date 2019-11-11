import { User } from './user';

export type Page = 
{
	id: string;
	createdAt: string;
	updatedAt: string;
	title: string;
	name: string;
	summary: string | null;
	content: Array<void>;
	variables: Array<void>;
	userId: string;
	user: User;
}