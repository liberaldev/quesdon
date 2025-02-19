import Koa from 'koa';
import Router from 'koa-router';
import fetch from 'node-fetch';
import parseLinkHeader, { Link, Links } from 'parse-link-header';
import { Account } from 'megalodon';
import { User as MisskeyUser } from '../../utils/misskey_entities/user';
import { Following } from '../../utils/misskey_entities/following';
import { oneLineTrim, stripIndents } from 'common-tags';
import { QUESTION_TEXT_MAX_LENGTH } from '../../../common/const';
import { BASE_URL, NOTICE_ACCESS_TOKEN, PUSHBULLET_CLIENT_ID, PUSHBULLET_CLIENT_SECRET } from '../../config';
import { Question, User } from '../../db/index';
import detectInstance from '../../utils/detectInstance';

const router = new Router();

router.get('/verify_credentials', async (ctx: Koa.ParameterizedContext): Promise<never|void> => 
{
	if (!ctx.session.user) 
		return ctx.throw('please login', 403);

	const user = await User.findById(ctx.session.user);
	if (!user) 
		return ctx.throw('not found', 404);

	ctx.body = user;
});

router.get('/followers', async (ctx: Koa.ParameterizedContext): Promise<never|void|{}> => 
{
	if (!ctx.session.user) 
		return ctx.throw('please login', 403);

	const user = await User.findById(ctx.session.user);
	if (!user) 
		return ctx.throw('not found', 404);

	// twitter
	if (user.hostName === 'twitter.com') 
		return ctx.body = { max_id: undefined, accounts: [] };

	const instanceUrl = 'https://' + user.acct.split('@')[1];
	const instanceType = await detectInstance(instanceUrl);

	if (instanceType === 'misskey')
	{
		// misskey
		const fetchOptions = 
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			};

		const myInfo: MisskeyUser = await fetch(`${instanceUrl}/api/i`,
			Object.assign({}, fetchOptions,
				{
					body: JSON.stringify( { i: user.accessToken })
				})).then(r => r.json());
		const body: { i: string; userId: string; limit: number; untilId?: string } = 
			{
				i: user.accessToken,
				userId: myInfo.id,
				limit: 80
			};
		if (ctx.query.max_id)
			body.untilId = ctx.query.max_id;
		const followersRaw: Following[] = await fetch(`${instanceUrl}/api/users/followers`,
			Object.assign({}, fetchOptions, { body: JSON.stringify(body) })).then(r => r.json());
		const followers = followersRaw
			.map(follower => `${follower.follower?.username}@${follower.follower?.host ?? user.acct.split('@')[1]}`.toLowerCase());
		const followersObject = await User.find({acctLower: {$in: followers}});
		const max_id = followersRaw[followersRaw.length - 1]?.id ?? '';
		return ctx.body = 
		{
			accounts: followersObject,
			max_id
		};	
	}
	
	// mastodon
	const myInfo = await fetch(`${instanceUrl}/api/v1/accounts/verify_credentials`, 
		{
			headers: { Authorization: 'Bearer ' + user.accessToken }
		}).then((r) => r.json());
	const param = ctx.query.max_id ? '&max_id=' + ctx.query.max_id : '';
	const followersRes = await fetch(`${instanceUrl}/api/v1/accounts/${myInfo.id}/followers?limit=80${param}`,
		{
			headers: { Authorization: 'Bearer ' + user.accessToken }
		});
	const  followersRaw: Account[] = await followersRes.json();
	const followers = followersRaw
		.map((follower) => follower.acct)
		.map((acct) => acct.includes('@') ? acct : (acct + '@' + user.acct.split('@')[1]))
		.map((acct) => acct.toLowerCase()); // create a string[] of followers in 'lowercase@host.name' form

	const followersObject = await User.find({acctLower: {$in: followers}});
	const max_id = ((parseLinkHeader(followersRes.headers.get('Link') ?? '') || {} as Links).next || {} as Link).max_id;
	return ctx.body = 
		{ 
			accounts: followersObject,
			max_id
		};
});

router.post('/update', async (ctx: Koa.ParameterizedContext): Promise<never|void> => 
{
	if (!ctx.session.user) 
		return ctx.throw('please login', 403);

	const user = await User.findById(ctx.session.user);
	if (!user) 
		return ctx.throw('not found', 404);

	user.description = ctx.request.body.description;
	user.questionBoxName = ctx.request.body.questionBoxName;
	user.allAnon = !!ctx.request.body.allAnon;
	user.stopNewQuestion = !!ctx.request.body.stopNewQuestion;
	await user.save();
	ctx.body = {status: 'ok'}; 
});

router.get('/id/:id', async (ctx): Promise<never|void> => 
{
	const user = await User.findById(ctx.params.id);
	if (!user) 
		return ctx.throw('not found', 404);
	ctx.body = user; 
});

router.get('/pushbullet/redirect', async (ctx: Koa.ParameterizedContext): Promise<never|void> => 
{
	if (!ctx.session.user) 
		return ctx.throw('please login', 403);

	const user = await User.findById(ctx.session.user);
	if (!user) 
		return ctx.throw('not found', 404);

	ctx.redirect(oneLineTrim`https://www.pushbullet.com/authorize
        ?client_id=${PUSHBULLET_CLIENT_ID}
        &redirect_uri=${encodeURIComponent(BASE_URL + '/api/web/accounts/pushbullet/callback')}
        &response_type=code
        &scope=everything`
	);
});

router.get('/pushbullet/callback', async (ctx: Koa.ParameterizedContext): Promise<never|void> => 
{
	if (!ctx.session.user) 
		return ctx.throw('please login', 403);

	const user = await User.findById(ctx.session.user);
	if (!user) 
		return ctx.throw('not found', 404);

	const res = await fetch('https://api.pushbullet.com/oauth2/token', 
		{
			method: 'POST',
			body: JSON.stringify(
				{
					client_id: PUSHBULLET_CLIENT_ID,
					client_secret: PUSHBULLET_CLIENT_SECRET,
					code: ctx.query.code,
					grant_type: 'authorization_code'
				}),
			headers: { 'Content-Type': 'application/json' }
		}).then((r) => r.json());
	if (res.error) 
		return ctx.throw(500, 'pushbullet error: ' + res.error.message);

	user.pushbulletAccessToken = res.access_token;
	await user.save();

	ctx.redirect('/my/settings');
});

router.post('/pushbullet/disconnect', async (ctx: Koa.ParameterizedContext): Promise<never|void> => 
{
	if (!ctx.session.user) 
		return ctx.throw('please login', 403);

	const user = await User.findById(ctx.session.user);
	if (!user) 
		return ctx.throw('not found', 404);

	user.pushbulletAccessToken = null;
	await user.save();

	ctx.body = {status: 'ok'}; 
});

router.get('/:acct', async (ctx): Promise<never|void> => 
{
	const user = await User.findOne({acctLower: ctx.params.acct.toLowerCase()});
	if (!user) 
		return ctx.throw('not found', 404);

	ctx.body = user; 
});

router.post('/:acct/question', async (ctx: Koa.ParameterizedContext): Promise<never|void> => 
{
	const questionString = ctx.request.body.question;

	if (questionString.length < 1) 
		return ctx.throw('please input question', 400);
	if (questionString.length > QUESTION_TEXT_MAX_LENGTH) 
		return ctx.throw('too long', 400);

	const user = await User.findOne({acctLower: ctx.params.acct.toLowerCase()});
	if (!user) 
		return ctx.throw('not found', 404);
	if (user.stopNewQuestion) 
		return ctx.throw(400, 'this user has stopped new question submit');

	const question = new Question();
	question.question = questionString;
	question.user = user;
	if (ctx.request.body.noAnon) 
	{
		if (user.allAnon) 
			return ctx.throw('all anon', 400);
		if (!ctx.session.user) 
			return ctx.throw('please login', 403);

		const questionUser = await User.findById(ctx.session.user);
		if (!questionUser) 
			return ctx.throw('not found', 404);

		question.questionUser = questionUser;
	}
	await question.save();

	ctx.body = {status: 'ok'};

	if (user.pushbulletAccessToken) 
	{
		fetch('https://api.pushbullet.com/v2/pushes', 
			{
				method: 'POST',
				body: JSON.stringify(
					{
						type: 'link',
						body: stripIndents`새로운 질문이에요!
							Q. ${question.question}`,
						url: BASE_URL + '/my/questions'
					}),
				headers: 
					{
						'Access-Token': user.pushbulletAccessToken,
						'Content-Type': 'application/json'
					}
			});
	}
	if (NOTICE_ACCESS_TOKEN) 
	{
		fetch('https://planet.moe/api/v1/statuses', 
			{
				method: 'POST',
				body: JSON.stringify(
					{
						status: stripIndents`@${user.acct} Quesdon@Planet - 새로운 질문이에요!
							Q. ${question.question}
							${BASE_URL}/my/questions`,
						visibility: 'direct'
					}),
				headers: 
					{
						'Authorization': 'Bearer ' + NOTICE_ACCESS_TOKEN,
						'Content-Type': 'application/json'
					}
			});
	}
});

const getAnswers = async (ctx: Koa.ParameterizedContext): Promise<void> => 
{
	const user = await User.findOne({acctLower: ctx.params.acct.toLowerCase()});
	if (!user) 
		return ctx.throw('not found', 404);
		
	const questions = await Question.find(
		{
			user,
			answeredAt: {$ne: null},
			isDeleted: {$ne: true}
		}).sort('-answeredAt');

	ctx.body = questions.map((question) => 
	{
		question.user = user;
		return question;
	});
};

router.get('/:acct/questions', getAnswers);
router.get('/:acct/answers', getAnswers);

export default router;
