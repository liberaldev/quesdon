export type DriveFile = 
{
	id: string;
	createdAt: string;
	name: string;
	type: string;
	md5: string;
	size: number;
	url: string | null;
	folderId: string | null;
	isSensitive: boolean;
}