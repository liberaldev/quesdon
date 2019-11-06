export function cutText(s: string, l: number): string
{
	if (s.length <= l) 
		return s;
	else 
		return s.slice(0, l - 1) + '…';
}
