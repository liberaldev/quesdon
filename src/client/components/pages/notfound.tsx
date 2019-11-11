import * as React from 'react';
import { Link } from 'react-router-dom';
import { Title } from '../common/title';

export class PageNotFound extends React.Component 
{
	render() 
	{
		return <div>
			<Title>Not Found</Title>
			<h1>Not Found</h1>
			<p>페이지를 찾을 수 없어요.</p>
			<p><Link to="/">메인으로 돌아가기</Link></p>
		</div>;
	}
}
