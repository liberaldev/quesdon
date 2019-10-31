import * as moment from 'moment';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardBody, CardSubtitle, CardText, CardTitle, FormGroup, Input } from 'reactstrap';
import { APIQuestion } from '../../api-interfaces';
import { apiFetch } from '../api-fetch';
import { Checkbox } from './common/checkbox';
import { UserLink } from './userLink';

interface Props extends APIQuestion {
    hideAnswerUser?: boolean | undefined;
    noNsfwGuard?: boolean | undefined;
}

interface State {
    isNotEmpty: boolean;
    nsfwGuard: boolean;
}

export class Question extends React.Component<Props, State> 
{
	constructor(props: Props) 
	{
		super(props);
		this.state = {
			isNotEmpty: false,
			nsfwGuard: this.props.isNSFW && !this.props.noNsfwGuard
		};
	}
	render() 
	{
		return <Card className="mb-3">
			<CardBody className={this.state.nsfwGuard ? 'nsfw-blur' : ''}>
				<CardTitle tag="h4">{this.props.question}</CardTitle>
				<CardSubtitle className="mb-2">
					{this.renderAnswerUser()}
					{this.props.answeredAt && <Link
						to={`/@${this.props.user.acct}/questions/${this.props._id}`}
						className="text-muted mr-2">
						{moment(this.props.answeredAt).format('YYYY-MM-DD HH:mm:ss')}
					</Link>}
					{this.renderQuestionUser()}
				</CardSubtitle>
				{this.props.answeredAt ? this.renderAnswer() : this.renderAnswerForm()}
			</CardBody>
			{ this.state.nsfwGuard && <div className="nsfw-guard" onClick={this.nsfwGuardClick.bind(this)}>
				<div>
					<div>열람 주의</div>
					{ !this.props.hideAnswerUser && <div>답변자: @{this.props.user.acctDisplay}</div>}
					<div>눌러서 표시</div>
				</div>
			</div> }
		</Card>;
	}

	renderAnswerUser() 
	{
		if (this.props.hideAnswerUser) return null;
		return <span className="mr-2">
            답변자:&nbsp;
			<UserLink {...this.props.user}/>
		</span>;
	}

	renderQuestionUser() 
	{
		if (!this.props.questionUser) return null;
		return <span className="mr-2">
            질문자:&nbsp;
			<UserLink {...this.props.questionUser}/>
		</span>;
	}

	renderAnswer() 
	{
		return <CardText className="question-text">{this.props.answer}</CardText>;
	}

	renderAnswerForm() 
	{
		return <form action="javascript://" onSubmit={this.onSubmit.bind(this)}>
			<FormGroup>
				<Input type="textarea" name="answer" placeholder="답변 내용을 입력해 주세요:" onInput={this.onInput.bind(this)}/>
			</FormGroup>
			<Button type="submit" color="primary" disabled={!this.state.isNotEmpty}>답변</Button>
			<span className="ml-3">공개 범위: </span>
			<Input type="select" name="visibility" style={{width: 'inherit', display: 'inline-block'}}>
				<option value="public">공개</option>
				<option value="unlisted">타임라인에 비표시</option>
				<option value="private">비공개</option>
				<option value="no">안 올릴 건데요!</option>
			</Input>
			<Checkbox name="isNSFW" value="true" className="ml-2">NSFW</Checkbox>
			<Button type="button" color="danger" style={{float: 'right'}} onClick={this.onDelete.bind(this)}>삭제</Button>
		</form>;
	}

	onInput(e: any) 
	{
		this.setState({isNotEmpty: e.target.value !== ''});
	}

	onSubmit(e: any) 
	{
		const form = new FormData(e.target);
		apiFetch('/api/web/questions/' + this.props._id + '/answer', {
			method: 'POST',
			body: form
		}).then((r) => r.json()).then((r) => 
		{
			alert('답변했어요!');
			location.reload();
		});
	}

	onDelete(e: any) 
	{
		if (!confirm('질문을 삭제하려고요?\n삭제한 질문은 다시 되돌릴 수 없어요.\n정말로 삭제하실 건가요?')) return;
		apiFetch('/api/web/questions/' + this.props._id + '/delete', {
			method: 'POST'
		}).then((r) => r.json()).then((r) => 
		{
			alert('삭제했어요.');
			location.reload();
		});
	}

	nsfwGuardClick() 
	{
		this.setState({nsfwGuard: false});
	}
}
