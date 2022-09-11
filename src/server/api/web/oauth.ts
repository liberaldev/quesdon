import Koa from 'koa';
import Router from 'koa-router';
import fetch from 'node-fetch';
import rndstr from 'rndstr';
import crypto from 'crypto';
import { URL } from 'url';
import { BASE_URL } from '../../config';
import { MastodonApp, User } from '../../db/index';
import QueryStringUtils from '../../utils/queryString';
import { requestOAuth } from '../../utils/requestOAuth';
import twitterClient from '../../utils/twitterClient';
import detectInstance from '../../utils/detectInstance';
import { App } from '../../utils/misskey_entities/app';
import { User as MisskeyUser } from '../../utils/misskey_entities/user';

const router = new Router();

router.post('/get_url', async (ctx: Koa.ParameterizedContext): Promise<never|void> => 
{
	const hostName = ctx.request.body.instance.replace(/.*@/, '').toLowerCase();
	if (hostName.includes('/')) 
		return ctx.throw(400, 'not use slash in hostname');

	const redirectUri = BASE_URL + '/api/web/oauth/redirect';
	let url = '';

	if (hostName === 'twitter.com') 
	{ 
		ctx.session.loginState = 'twitter';
		const { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET } = process.env;
		if (TWITTER_CONSUMER_KEY === null || TWITTER_CONSUMER_SECRET === null) 
			ctx.throw(500, 'twitter not supported in this server.');
		const requestTokenRes = await requestOAuth(twitterClient, 
			{
				url: 'https://api.twitter.com/oauth/request_token',
				method: 'POST',
				data: {}
			}).then((r) => r.text()).then((r) => QueryStringUtils.decode(r));
		const requestToken = 
			{
				token: requestTokenRes.oauth_token,
				secret: requestTokenRes.oauth_token_secret
			};
		ctx.session.twitterOAuth = requestToken;
		url = `https://twitter.com/oauth/authenticate?oauth_token=${requestToken.token}`;
	}
	else
	{ 
		const instanceType = await detectInstance(`https://${hostName}`);
		if (
			instanceType === 'misskey' ||
			instanceType === 'cherrypick' ||
			instanceType === 'Castella'
		)
		{
			let app = await MastodonApp.findOne( { hostName, appBaseUrl: BASE_URL, redirectUri } );
			if (!app) // if it's the first time user from this instance is using quesdon
			{
				const res: App = await fetch(`https://${hostName}/api/app/create`,
					{
						method: 'POST',
						body: JSON.stringify(
							{
								name: 'Quesdon',
								description: BASE_URL,
								permission: ['read:following', 'write:notes'],
								callbackUrl: redirectUri
							}),
						headers: { 'Content-Type': 'application/json' }
					}).then(r => r.json());

				app = new MastodonApp();
				app.clientId = res.id,
				app.clientSecret = res.secret as string;
				app.hostName = hostName;
				app.appBaseUrl = BASE_URL;
				app.redirectUri = redirectUri;

				await app.save();
			}
			ctx.session.loginState = `misskey_${app.id}`;
			const res = await fetch(`https://${hostName}/api/auth/session/generate`, // get authentication url from misskey instance
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify( { appSecret: app.clientSecret } )
				}).then(r => r.json());
			url = res.url;
		}
		else
		{
			// Mastodon 
			let app = await MastodonApp.findOne( { hostName, appBaseUrl: BASE_URL, redirectUri } );
			if (!app) 
			{
				const res = await fetch('https://' + hostName + '/api/v1/apps', 
					{
						method: 'POST',
						body: JSON.stringify(
							{
								client_name: 'Quesdon',
								redirect_uris: redirectUri,
								scopes: 'read write',
								website: BASE_URL
							}),
						headers: { 'Content-Type': 'application/json' }
					}).then((r) => r.json());

				app = new MastodonApp();
				app.clientId = res.client_id;
				app.clientSecret = res.client_secret;
				app.hostName = hostName;
				app.appBaseUrl = BASE_URL;
				app.redirectUri = redirectUri;

				await app.save();
			}
			ctx.session.loginState = `${rndstr()}_${app.id}`;
			const params: {[key: string]: string} = 
			{
				client_id: app.clientId,
				scope: 'read+write',
				redirect_uri: redirectUri,
				response_type: 'code',
				state: ctx.session.loginState
			};
			url = `https://${app.hostName}/oauth/authorize?${Object.entries(params).map((v) => v.join('=')).join('&')}`;
		}
	}
	ctx.body = { url };
});

router.get('/redirect', async (ctx: Koa.ParameterizedContext) => 
{
	let profile: 
		{
			id: string;
			name: string;
			screenName: string;
			avatarUrl: string;
			accessToken: string;
			hostName: string;
			url: string;
			acct: string;
		};
	
	if ((ctx.session.loginState as string).startsWith('misskey'))
	{
		// misskey
		const app = await MastodonApp.findById(ctx.session.loginState.split('_')[1]);
		if (app === null)
			return ctx.redirect('/login?error=app_notfound');
		
		const res: { accessToken: string; user: MisskeyUser } = await fetch(`https://${app.hostName}/api/auth/session/userkey`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(
					{
						appSecret: app.clientSecret,
						token: ctx.query.token
					})
			}).then(r => r.json());
		
		profile = 
			{
				id: res.user.id,
				name: res.user.name ?? res.user.username,
				screenName: res.user.username,
				hostName: app.hostName,
				avatarUrl: res.user.avatarUrl as string,
				accessToken: crypto.createHash('sha256').update(res.accessToken + app.clientSecret).digest('hex'),
				url: `https://${app.hostName}/@${res.user.username}`,
				acct: `${res.user.username}@${app.hostName}`
			};
	}
	else if (ctx.session.loginState !== 'twitter') 
	{
		// Mastodon
		if (ctx.query.state !== ctx.session.loginState) 
			return ctx.redirect('/login?error=invalid_state');

		const app = await MastodonApp.findById(ctx.session.loginState.split('_')[1]);
		if (app === null)
			return ctx.redirect('/login?error=app_notfound');

		const res = await fetch('https://' + app.hostName + '/oauth/token', 
			{
				method: 'POST',
				body: JSON.stringify({
					grant_type: 'authorization_code',
					redirect_uri: app.redirectUri,
					client_id: app.clientId,
					client_secret: app.clientSecret,
					code: ctx.query.code,
					state: ctx.query.state
				}),
				headers: { 'Content-Type': 'application/json' }
			}).then((r) => r.json());

		const myProfile = await fetch('https://' + app.hostName + '/api/v1/accounts/verify_credentials', 
			{
				headers: { Authorization: 'Bearer ' + res.access_token }
			}).then((r) => r.json());
			
		profile = 
			{
				id: myProfile.id,
				name: myProfile.display_name || myProfile.username,
				screenName: myProfile.username,
				hostName: app.hostName,
				avatarUrl: myProfile.avatar_static,
				accessToken: res.access_token,
				url: myProfile.url,
				acct: myProfile.username + '@' + app.hostName
			};
	}
	else 
	{ // twitter
		const requestToken: 
		{
            token: string;
            secret: string;
		} | undefined = ctx.session.twitterOAuth;
		
		if (!requestToken) 
			return ctx.redirect('/login?error=no_request_token');
		if (requestToken.token !== ctx.query.oauth_token) 
			return ctx.redirect('/login?error=invalid_request_token');
			
		let accessToken;
		try 
		{
			const accessTokenRes = await requestOAuth(twitterClient, 
				{
					url: 'https://api.twitter.com/oauth/access_token',
					method: 'POST',
					data: { oauth_verifier: ctx.query.oauth_verifier }
				}, 
				{
					key: requestToken.token,
					secret: requestToken.secret
				}).then((r) => r.text()).then((r) => QueryStringUtils.decode(r));
			accessToken = 
				{
					key: accessTokenRes.oauth_token,
					secret: accessTokenRes.oauth_token_secret
				};
		}
		catch (e) 
		{
			return ctx.redirect('/login?error=failed_access_token_fetch');
		}

		let resp;
		try 
		{
			resp = await requestOAuth(twitterClient, 
				{
					url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
					method: 'GET',
					data: {}
				}, accessToken).then((r) => r.json());
		}
		catch (e) 
		{
			return ctx.redirect('/login?error=failed_user_profile_fetch');
		}

		profile = 
		{
			id: resp.id_str,
			name: resp.name,
			screenName: resp.screen_name,
			hostName: 'twitter.com',
			avatarUrl: resp.profile_image_url_https.replace('_normal.', '_400x400.'),
			accessToken: accessToken.key + ':' + accessToken.secret,
			url: 'https://twitter.com/' + resp.screen_name,
			acct: resp.screen_name + ':' + resp.id_str + '@twitter.com'
		};
	}
	if (!profile) return;

	const acct = profile.acct;
	let user;
	
	if (profile.hostName !== 'twitter.com') // Mastodon and misskey
		user = await User.findOne({acctLower: acct.toLowerCase()});
	else 
		user = await User.findOne({upstreamId: profile.id, hostName: profile.hostName});

	if (user === null) 
		user = new User();

	user.acct = acct;
	user.acctLower = acct.toLowerCase();
	user.name = profile.name;
	user.avatarUrl = profile.avatarUrl;
	user.accessToken = profile.accessToken;
	user.hostName = profile.hostName;
	user.url = profile.url;
	user.upstreamId = profile.id;
	await user.save();

	ctx.session.user = user.id;
	
	ctx.redirect('/my');
});

export default router;
