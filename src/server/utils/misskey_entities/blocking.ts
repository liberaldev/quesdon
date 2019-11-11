import { User } from './user';

export type Blocking = 
{
	id: string;
	createdAt: string;
	blockeeId: string;
	blockee: User;
}