export type UserGroup = 
{
	id: string;
	createdAt: string;
	name: string;
	ownerId: string;
	userIds?: Array<string>;
}