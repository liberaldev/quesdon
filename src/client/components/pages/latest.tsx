import * as React from 'react';
import { Button } from 'reactstrap';
import { APIQuestion } from '../../../api-interfaces';
import { apiFetch } from '../../api-fetch';
import { Title } from '../common/title';
import { Loading } from '../loading';
import { Question } from '../question';

interface State {
    questions: APIQuestion[];
    loading: boolean;
    loadFailed?: number;
    loadTimer?: number;
}

export class PageLatest extends React.Component<{}, State> 
{
	constructor(props: any) 
	{
		super(props);
		this.state = {
			questions: [],
			loading: true
		};
	}
	render() 
	{
		const {
			loading,
			loadFailed,
			questions
		} = this.state;
		return <div>
			<Title>최근 답변</Title>
			<h2>최근 올라온 답변들 <Button color="white" onClick={this.load.bind(this)} disabled={loading}>새로고침</Button></h2>
			{ loading
				? <Loading/>
				: loadFailed
					? <span>
                        불러오기에 실패했어요. 위쪽 새로고침 버튼을 눌러서 다시 시도해 주세요.
                        ({loadFailed < 0 ? loadFailed : 'HTTP-' + loadFailed})
					</span>
					: questions.map((question) => <Question {...question} key={question._id}/>)
			}
		</div>;
	}

	componentDidMount() 
	{
		this.load();
		this.setState({
			loadTimer: window.setInterval(() => 
			{
				this.load();
			}, 5 * 60 * 1000)
		});
	}

	componentWillUnmount() 
	{
		const {loadTimer} = this.state;
		if (loadTimer != null) 
		{
			window.clearInterval(loadTimer);
		}
	}

	async load() 
	{
		this.setState({loading: true});
		const req = await apiFetch('/api/web/questions/latest').catch((err) => 
		{
			this.setState({
				loading: false,
				loadFailed: -1
			});
		});
		if (!req) return;
		if (!req.ok) 
		{
			this.setState({
				loading: false,
				loadFailed: req.status
			});
		}

		const questions = await req.json().catch((err) => 
		{
			this.setState({
				loading: false,
				loadFailed: -2
			});
		});
		if (!questions) return;
		this.setState({
			loading: false,
			loadFailed: undefined,
			questions
		});
	}
}
