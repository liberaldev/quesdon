import * as React from "react"
import { Link } from "react-router-dom"
import { gitVersion, upstreamUrl, usingDarkTheme } from "../initial-state"

export class Footer extends React.Component {
    render() {
        return <footer className="container">
            <p>
                Quesdon@Planet은 <a href="https://quesdon.rinsuki.net/">Quesdon</a>의 포크로,
                AGPL-3.0 라이센스로 제공되고 있어요.
                <a href={upstreamUrl}>소스 코드</a>&nbsp;
                (<a href={`${upstreamUrl}/commits/${gitVersion}`}>{gitVersion.slice(0, 7)}</a>) /&nbsp;
                <a href="https://github.com/rinsuki/quesdon">원본 소스 코드 (rinsuki/quesdon)</a>&nbsp;
                </p>
            <p>
                플래닛 공식 계정: <a href="https://planet.moe/@planet">@planet@planet.moe</a>
            </p>
            <p>원작자: <a href="https://mstdn.maud.io/@rinsuki">@rinsuki@mstdn.maud.io</a></p>
            <p>
                {usingDarkTheme
                ?   <a href="#" onClick={this.leaveDarkTheme.bind(this)}>밝은 배경</a>
                :   <a href="#" onClick={this.enterDarkTheme.bind(this)}>어두운 배경(β)</a>
                }
            </p>
        </footer>
    }

    leaveDarkTheme() {
        localStorage.removeItem("using-dark-theme")
        location.reload()
    }

    enterDarkTheme() {
        localStorage.setItem("using-dark-theme", "1")
        location.reload()
    }
}
