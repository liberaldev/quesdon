import Koa from 'koa';
import Router from 'koa-router';
import accountsRouter from './accounts';
import oauthRouter from './oauth';
import questionsRouter from './questions';

const router = new Router();

router.use(async (ctx: Koa.ParameterizedContext, next): Promise<void> => 
{
	if (ctx.request.method !== 'GET') 
		if (ctx.session.csrfToken !== ctx.request.headers['x-csrf-token']) 
			return ctx.throw('invalid csrf token', 403);

	await next();
});

router.use('/oauth', oauthRouter.routes());
router.use('/accounts', accountsRouter.routes());
router.use('/questions', questionsRouter.routes());

router.get('/logout', (ctx: Koa.ParameterizedContext) => 
{
	ctx.session.user = undefined;
	ctx.body = { status: 'ok' };
});

export default router;
