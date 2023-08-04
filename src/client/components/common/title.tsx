import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Children } from 'react';


export class Title extends React.Component 
{
	title = (): string =>
	{
		const childrenAsString: string = Children.map(this.props.children, child =>
		{
			return child?.toString();
		}).join('').toString();
		return childrenAsString + ' - Quesdon@Planet';
	};

	render(): React.ReactNode
	{
		return (
			<Helmet>
				<title>{this.title()}</title>
			</Helmet>
		);
	}
}
