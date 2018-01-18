import * as React from "react"
import { Jumbotron, Input, Button, Badge } from "reactstrap";
import { APIUser, APIQuestion } from "../../../../api-interfaces";
import Checkbox from "../../common/checkbox"
import Question from "../../question"
import apiFetch from "../../../api-fetch";

interface Props {
    match: {
        params: {[key: string]: string}
    }
}

interface State {
    user: APIUser | undefined
    questions: APIQuestion[] | undefined
}

export default class PageUserIndex extends React.Component<Props,State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            user: undefined,
            questions: undefined,
        }
    }

    componentDidMount() {
        apiFetch("/api/web/accounts/"+this.props.match.params.user_id)
            .then(r => r.json())
            .then(user => this.setState({user}))
        apiFetch("/api/web/accounts/"+this.props.match.params.user_id+"/questions")
            .then(r => r.json())
            .then(questions => this.setState({questions}))
    }

    render() {
        console.log(this.props)
        const { user } = this.state
        if (!user) return null
        return <div>
            <Jumbotron><div style={{textAlign: "center"}}>
                <img src={user.avatarUrl}/>
                <h1>{user.name}</h1>
                <p>
                    さんの{user.questionBoxName || "質問箱"}&nbsp;
                    <a href={user.url || `https://${user.hostName}/@${user.acct.split("@")[0]}`}
                        rel="nofollow">
                        Mastodonのプロフィール
                    </a>
                </p>
                <p>{user.description}</p>
                <form>
                    <Input type="textarea" name="question"
                        placeholder="質問する内容を入力"
                    />
                    <div className="d-flex mt-1">
                        {!user.allAnon && <div className="p-1">
                            <Checkbox name="noAnon" value="true">名乗る</Checkbox>
                        </div>}
                        <div className="ml-auto">
                            <span className="mr-3">500</span>
                            <Button color="primary" className="col-xs-2">質問する</Button>
                        </div>
                    </div>
                </form>
            </div></Jumbotron>
            {this.state.questions && 
                <div>
                    <h2>回答&nbsp;<Badge pill>{this.state.questions.length}</Badge></h2>
                    {this.state.questions.map(question => <Question {...question}/>)}
                </div>
            }
        </div>
    }
}