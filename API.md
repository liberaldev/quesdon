# API Layout
> Note: all non-GET methods require X-CSRF-Token

## OAuth
API endpoints used for OAuth-ing Mastodon and Twitter.

### `POST /api/web/oauth/get_url`
- instance: string - Instance URL

### `POST /api/web/oauth/redirect`
OAuth callback endpoint

## Accounts
API endpoints relating to accounts

### `GET /api/web/accounts/verify_credentials`
Get the object of user currently logged in with.
Login required.

- returns user object

### `GET /api/web/accounts/followers`
Get your followers who is registered in Quesdon.
Login required.

- max_id: string - Max follower ID (twitter is not supported)

- returns `{ accounts: 'followersObject', max_id: 'new max id' }`

### `POST /api/web/accounts/update`
Update Quesdon profile.
Login rquired.

- description: string
- questionBoxName: string
- allAnon: boolean
- stopNewQuestion: boolean

### `GET /api/web/accounts/id/:id`
Get object of specified user `:id`.

- returns user object

### `GET /api/web/accounts/pushbullet/redirect`
Redirects to pushbullet authorization screen.
Login required.

### `GET /api/web/accounts/pushbullet/callback`
Pushbullet callback endpoint.
Login required.

### `GET /api/web/accounts/pushbullet/disconnect`
Disconnect pushbullet and delete pushbullet token.
Login required.

### `GET /api/web/accounts/:acct`
Get object of the specified user `:acct`.

- returns user object

### `GET /api/web/accounts/:acct/question`
Ask a question to user `:acct`

- question: string

### `GET /api/web/accounts/:acct/questions`
Get answered questions of `:acct`

- returns array of questions

### `GET /api/web/accounts/:acct/answers`
Same as `GET /api/web/accounts/:acct/questions`

## Questions
API endpoints relating to questions

### `GET /api/web/questions`
Get unanswered questions of current user.
Login required.

- returns array of questions

### `GET /api/web/questions/count`
Get number of remaining unanswered questions.
Login required.

- returns number of remaining questions

### `GET /api/web/questions/latest`
Get 20 most recent answered questions

- returns array of questions

### `POST /api/web/questions/:id/answer`
Answer question `:id`
Login required.

- answer: string - answer to the question
- isNSFW: boolean - true if NSFW
- visibility: string - visibility of the answer (public, unlisted, or private)

### `POST /api/web/questions/:id/delete`
Delete question `:id`
Login required.

### `POST /api/web/questions/:id/like`
Like question `:id`
Login required.

### `POST /api/web/questions/:id/unlike`
Unlike question `:id`
Login required.

### `GET /api/web/questions/:id`
Get question `:id`

- returns question object

### `POST /api/web/questions/all_delete`
Delete all questions.
Login required.

## Logout

### `GET /api/web/logout`
Delete current session.