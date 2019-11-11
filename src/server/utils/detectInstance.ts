import fetch from 'node-fetch';

type nodeinfoMeta =
{
	links: nodeinfoVersionList[];
};

type nodeinfoVersionList = 
{
	rel: string;
	href: string;
}

type nodeinfo = 
{
	version: string;
	software: { name: string; version: string };
	// irrelevent properties skipped
}

export default async function detectInstance(url: string): Promise<string|undefined>
{
	const parsedURL = new URL(url);
	if(parsedURL.hostname === 'twitter.com')
		return 'twitter';
	
	// fediverse
	const nodeinfoMeta: nodeinfoMeta = await fetch(`${parsedURL.origin}/.well-known/nodeinfo`).then(r => r.json());
	const nodeinfoLink = nodeinfoMeta.links.find(elem => elem.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.0');

	// TODO: add support for 1.0 as a fallback? All latest versions of major AP softwares seem to support 2.0 tho
	if(!nodeinfoLink)
		return undefined;
	const nodeinfo: nodeinfo = await fetch(`${nodeinfoLink.href}`).then(r => r.json());
	return nodeinfo.software.name;
}