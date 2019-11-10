import { User } from './user';

export type Muting = 
{
	id: string;
	createdAt: string;
	muteeId: string;
	mutee: User;
}