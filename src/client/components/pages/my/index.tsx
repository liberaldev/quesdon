import * as React from "react"
import { Link } from "react-router-dom"
import { APIUser } from "../../../../api-interfaces"
import { apiFetch } from "../../../api-fetch"
import { me } from "../../../initial-state"
import { Title } from "../../common/title"
import { QuestionRemaining } from "../../question-remaining"

export class PageMyIndex extends React.Component {
    render() {
        if (!me) return null
        return <div>
            <Title>마이페이지</Title>
            <h1>마이페이지</h1>
            <p>반가워요, {me.name}님!</p>
            <ul>
                <li><Link to={`/@${me.acct}`}>프로필 페이지</Link></li>
                <li><Link to="/my/questions">받은 질문<QuestionRemaining/></Link></li>
                {!me.isTwitter && <li><Link to="/my/followers">Quesdon@Planet을 사용중인 팔로워 목록</Link></li>}
                <li><Link to="/my/settings">설정</Link></li>
                <li><a href="javascript://" onClick={this.logoutConfirm.bind(this)}>로그아웃</a></li>
            </ul>
        </div>
    }
    logoutConfirm() {
        if (!confirm("정말 로그아웃 하실 건가요?")) return
        apiFetch("/api/web/logout")
            .then((r) => r.json())
            .then((r) => {
                location.pathname = "/"
            })
    }
}
