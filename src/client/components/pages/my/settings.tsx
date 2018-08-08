import * as React from "react"
import { Link } from "react-router-dom"
import { Button, FormGroup, FormText, Input, InputGroup, InputGroupAddon } from "reactstrap"
import { apiFetch } from "../../../api-fetch"
import { me } from "../../../initial-state"
import { Checkbox } from "../../common/checkbox"
import { Title } from "../../common/title"

interface State {
    descriptionMax: number
    questionBoxNameMax: number
    descriptionCount: number
    questionBoxNameCount: number
    saving: boolean
}

export class PageMySettings extends React.Component<{}, State> {
    constructor(props: any) {
        super(props)
        if (!me) return
        this.state = {
            descriptionMax: 200,
            questionBoxNameMax: 10,
            descriptionCount: (me.description || "").length,
            questionBoxNameCount: (me.questionBoxName || "질문 상자").length,
            saving: false,
        }
    }
    render() {
        if (!me) return null
        return <div>
            <Title>설정</Title>
            <h1>설정</h1>
            <Link to="/my">마이페이지로 돌아가기</Link>
            <form action="javascript://" onSubmit={this.onSubmit.bind(this)}>
                <FormGroup>
                    <label>간단한 설명</label>
                    <Input type="textarea" name="description"
                        placeholder="이루어져라, 우리들의 꿈!"
                        onInput={this.inputDescription.bind(this)}
                        defaultValue={me.description}/>
                    <FormText>앞으로 {this.descriptionRemaining()}자, 줄바꿈은 표시되지 않아요</FormText>
                </FormGroup>
                <FormGroup>
                    <label>'질문 상자'의 이름</label>
                    <InputGroup>
                        <InputGroupAddon addonType="prepend">누구누구 님의 </InputGroupAddon>
                        <Input type="text" name="questionBoxName" placeholder="질문 상자"
                            onInput={this.inputQuestionBoxName.bind(this)}
                            defaultValue={me.questionBoxName || "질문 상자"}/>
                    </InputGroup>
                    <FormText>앞으로 {this.questionBoxNameRemaining()}자, 줄바꿈은 표시되지 않아요</FormText>
                </FormGroup>
                <FormGroup>
                    <Checkbox name="allAnon" value="1" checked={me.allAnon}>질문을 익명으로만 받기</Checkbox>
                </FormGroup>
                <FormGroup>
                    <Checkbox name="stopNewQuestion" value="1" checked={me.stopNewQuestion}>더 이상 질문을 안 받기</Checkbox>
                </FormGroup>
                <Button type="submit" color="primary" disabled={this.sendableForm()}>
                    저장{this.state.saving && "중이에요..."}
                </Button>
            </form>
            <h2 className="mt-3 mb-2">푸시 알림</h2>
            {me.pushbulletEnabled
            ?   <Button color="warning" onClick={this.pushbulletDisconnect.bind(this)}>Pushbullet과 연결 해제</Button>
            :   <Button href="/api/web/accounts/pushbullet/redirect" color="success">
                    Pushbullet과 연결해서 새로운 질문이 들어왔을 때 알림 받기
                </Button>
            }
            <h2 className="mt-3 mb-2">짱 위험한 곳</h2>
            <Button color="danger" onClick={this.allDeleteQuestions.bind(this)}>받았던 질문들을(이미 답변한거까지 포함해서!) 싹 다 날려버리기!!!</Button>
        </div>
    }

    sendableForm() {
        return this.questionBoxNameRemaining() < 0 || this.descriptionRemaining() < 0 || this.state.saving
    }

    descriptionRemaining() {
        return this.state.descriptionMax - this.state.descriptionCount
    }

    questionBoxNameRemaining() {
        return this.state.questionBoxNameMax - this.state.questionBoxNameCount
    }

    inputDescription(e: any) {
        this.setState({
            descriptionCount: e.target.value.length,
        })
    }

    inputQuestionBoxName(e: any) {
        this.setState({
            questionBoxNameCount: e.target.value.length,
        })
    }

    async pushbulletDisconnect() {
        function errorMsg(code: number | string) {
            return "通信に失敗しました。再度お試しください (" + code + ")"
        }
        const req = await apiFetch("/api/web/accounts/pushbullet/disconnect", {
            method: "POST",
        }).catch((e) => {
            alert(errorMsg(-1))
        })
        if (!req) return
        if (!req.ok) {
            alert(errorMsg("HTTP-" + req.status))
            return
        }

        const res = await req.json().catch((e) => {
            alert(errorMsg(-2))
        })
        if (!res) return

        alert("切断しました。")
        location.reload()
    }

    async allDeleteQuestions() {
        function errorMsg(code: number | string) {
            return "通信に失敗しました。再度お試しください (" + code + ")"
        }
        if (!me) return
        const rand = Math.floor(Math.random() * 9) + 1
        if (prompt(`あなた(@${me.acctDisplay})あてに来た質問を「回答済みのものも含めて全て」削除します。

確認のために「${rand}」を下に入力してください(数字だけ入力してください)`, "") !== rand.toString()) return
        const req = await apiFetch("/api/web/questions/all_delete", {
            method: "POST",
        }).catch((e) => {
            alert(errorMsg(-1))
        })
        if (!req) return
        if (!req.ok) {
            alert(errorMsg("HTTP-" + req.status))
            return
        }

        const res = await req.json().catch((e) => {
            alert(errorMsg(-2))
            return
        })
        if (!res) return

        alert("削除しました。")
        location.reload()
    }

    async onSubmit(e: any) {
        function errorMsg(code: number | string) {
            return "通信に失敗しました。再度お試しください (" + code + ")"
        }
        this.setState({saving: true})

        const form = new FormData(e.target)
        const req = await apiFetch("/api/web/accounts/update", {
            method: "POST",
            body: form,
        }).catch(() => {
            alert(errorMsg(-1))
            this.setState({
                saving: false,
            })
        })
        if (!req) return
        if (!req.ok) {
            alert(errorMsg("HTTP-" + req.status))
            this.setState({
                saving: false,
            })
            return
        }

        const res = req.json().catch(() => {
            alert(errorMsg(-2))
            this.setState({
                saving: false,
            })
        })
        if (!res) return

        alert("更新しました!")
        location.reload()
    }

}
