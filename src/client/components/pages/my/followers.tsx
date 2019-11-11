import * as React from 'react';
import { Button } from 'reactstrap';
import { APIUser } from '../../../../api-interfaces';
import { apiFetch } from '../../../api-fetch';
import { Title } from '../../common/title';
import { UserLink } from '../../userLink';

interface State {
    maxId: string | undefined;
    accounts: APIUser[];
    loading: boolean;
}

export class PageMyFollowers extends React.Component<{}, State> 
{
	constructor(props: any) 
	{
		super(props);
		this.state = {
			accounts: [],
			maxId: undefined,
			loading: false
		};
	}

	render() 
	{
		return <div>
			<Title>Quesdon@Planet을 사용 중인 팔로워 목록 - 마이페이지</Title>
			<h1>Quesdon@Planet을 사용 중인 팔로워 목록</h1>
			<ul>
				{this.state.accounts.map((user) => <li><UserLink {...user} /></li>)}
			</ul>
			<Button disabled={this.state.loading || !this.state.maxId}
				onClick={this.readMore.bind(this)}>
				{this.state.loading ? '불러오는 중' : this.state.maxId ? '더 보기' : '이게 끝이에요 0_0'}
			</Button>
		</div>;
	}

	componentDidMount() 
	{
		this.readMore();
	}

	async readMore() 
	{
		function errorMsg(code: number | string) 
		{
			return '불러오기에 실패했어요. 다시 시도해 주세요. (' + code + ')';
		}
		this.setState({loading: true});
		const param = this.state.maxId ? '?max_id=' + this.state.maxId : '';
		const req = await apiFetch('/api/web/accounts/followers' + param)
			.catch((e) => 
			{
				alert(errorMsg(-1));
				this.setState({
					loading: false
				});
			});
		if (!req) return;
		if (!req.ok) 
		{
			alert(errorMsg('HTTP-' + req.status));
			this.setState({
				loading: false
			});
			return;
		}
		const res = await req.json().catch((e) => 
		{
			alert(errorMsg(-2));
			this.setState({
				loading: false
			});
		});
		if (!res) return;
		this.setState({
			accounts: this.state.accounts.concat(res.accounts),
			maxId: res.max_id,
			loading: false
		});
	}
}
