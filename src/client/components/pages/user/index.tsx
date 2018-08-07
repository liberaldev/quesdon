import * as React from "react"
import { Badge, Button, Input, Jumbotron } from "reactstrap"
import { APIQuestion, APIUser } from "../../../../api-interfaces"
import { QUESTION_TEXT_MAX_LENGTH } from "../../../../common/const"
import { apiFetch } from "../../../api-fetch"
import { me } from "../../../initial-state"
import { Checkbox } from "../../common/checkbox"
import { Title } from "../../common/title"
import { Loading } from "../../loading"
import { Question } from "../../question"

interface Props {
    userId: string
}

interface State {
    user: APIUser | undefined
    questions: APIQuestion[] | undefined
    questionLength: number
    questionNow: boolean
}

export class PageUserIndex extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            user: undefined,
            questions: undefined,
            questionLength: 0,
            questionNow: false,
        }
    }

    render() {
        const { user } = this.state
        if (!user) return <Loading/>
        return <div>
            <Title>{user.name}님의 {user.questionBoxName || "질문함"}</Title>
            <Jumbotron><div style={{textAlign: "center"}}>
                <img src={user.avatarUrl} style={{maxWidth: "8em", height: "8em"}}/>
                <h1>{user.name}</h1>
                <p>
                    님의 {user.questionBoxName || "질문함"}&nbsp;
                    <a href={user.url || `https://${user.hostName}/@${user.acct.split("@")[0]}`}
                        rel="nofollow">
                        Mastodon 프로필
                    </a>
                </p>
                <p>{user.description}</p>
                { user.stopNewQuestion ? <p>지금은 더 이상 질문을 안 받고 있어요.</p> :
                <form action="javascript://" onSubmit={this.questionSubmit.bind(this)}>
                    <Input type="textarea" name="question"
                        placeholder="질문 내용을 입력해 주세요:"
                        onInput={this.questionInput.bind(this)}
                    />
                    <div className="d-flex mt-1">
                        {me && !user.allAnon && <div className="p-1">
                            <Checkbox name="noAnon" value="true">작성자 공개</Checkbox>
                        </div>}
                        <div className="ml-auto">
                            <span className={"mr-3 " +
                                (this.state.questionLength > QUESTION_TEXT_MAX_LENGTH ? "text-danger" : "")
                            }>
                                {QUESTION_TEXT_MAX_LENGTH - this.state.questionLength}
                            </span>
                            <Button color="primary" className="col-xs-2"
                                disabled={
                                    !this.state.questionLength
                                    || this.state.questionLength > QUESTION_TEXT_MAX_LENGTH
                                    || this.state.questionNow
                                }>
                                질문{this.state.questionNow ? "중..." : "하기"}
                            </Button>
                        </div>
                    </div>
                </form>
                }
            </div></Jumbotron>
                        <h2>답변&nbsp;{this.state.questions && <Badge pill>{this.state.questions.length}</Badge>}</h2>
            {this.state.questions
            ?   <div>
                    {this.state.questions.map((question) =>
                        <Question {...question} hideAnswerUser key={question._id}/>,
                    )}
                </div>
            :   <Loading />
            }
        </div>
    }

    componentDidMount() {
        apiFetch("/api/web/accounts/" + this.props.userId)
            .then((r) => r.json())
            .then((user) => this.setState({user}))
        apiFetch("/api/web/accounts/" + this.props.userId + "/answers")
            .then((r) => r.json())
            .then((questions) => this.setState({questions}))
    }

    questionSubmit(e: any) {
        if (!this.state.user) return
        this.setState({questionNow: true})
        const form = new FormData(e.target)
        apiFetch("/api/web/accounts/" + this.state.user.acct + "/question", {
            method: "POST",
            body: form,
        }).then((r) => r.json()).then((r) => {
            this.setState({questionNow: false})
            alert("질문을 보냈어요!")
            location.reload()
        })
    }

    questionInput(e: any) {
        const count = e.target.value.length
        this.setState({
            questionLength: count,
        })
    }
}
