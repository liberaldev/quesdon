import Koa from 'koa';
import koaBody from 'koa-body';
import mount from 'koa-mount';
import Pug from 'koa-pug';
import Router from 'koa-router';
import session from 'koa-session';
import koaStaticCache from 'koa-static-cache';
import path from 'path';
import rndstr from 'rndstr';
import apiRouter from './api';
import { GIT_COMMIT, PORT, SECRET_KEY } from './config';
import { User } from './db/index';

const app = new Koa();

app.keys = [SECRET_KEY];

new Pug( { viewPath: path.join(__dirname, '../../views') } ).use(app);
app.use(koaBody( { multipart: true } ));
app.use(session({}, app));

app.use(mount('/assets', koaStaticCache(__dirname + '/../client')));

const router = new Router();

router.use('/api', apiRouter.routes());

router.get('/*', async (ctx: Koa.ParameterizedContext) => 
{
	let user;
	if (ctx.session.user) 
	{
		user = await User.findById(ctx.session.user);
		user = JSON.stringify(user).replace(/[\u0080-\uFFFF]/g, (chr) => '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).substr(-4) );
		user = new Buffer(user, 'binary').toString('base64');
	}
	if (!ctx.session.csrfToken)
		ctx.session.csrfToken = rndstr();
	ctx.render('index.pug', 
		{
			GIT_COMMIT,
			user,
			csrfToken: ctx.session.csrfToken
		});
});

app.use(router.routes());
app.listen(PORT, () => console.log('listen for http://localhost:' + PORT) ); // eslint-disable-line no-console
