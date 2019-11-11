export type DriveFolder = 
{
	id: string;
	createdAt: string;
	name: string;
	foldersCount?: number;
	filesCount?: number;
	parentId: string | null;
	parent?: DriveFolder | null;
}