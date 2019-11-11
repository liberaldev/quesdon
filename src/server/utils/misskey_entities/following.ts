import { User } from './user';

export type Following = 
{
	id: string;
	createdAt: string;
	followeeId: string;
	followee?: User;
	followerId: string;
	follower?: User;
}