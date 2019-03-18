import React, { Component } from 'react';
import { Table } from 'reactstrap';
import {fetchTextMessages} from '../../services/Rock7Utils'
import hexToAscii from '../../services/HexToAscii';
import { timestampMsToReadableDate } from '../../services/DateUtils';
import NotificationSystem from 'react-notification-system';
import ITextMessage from '../../model/ITextMessage';

type stateType = {
    messages: ITextMessage[]
}


/**
 * Display iridium / rock7 plain text messages
 */
export default class TextMessages extends Component<{},stateType> {

    _notificationSystem: any = null
    timerID: number = 0

    constructor(props: any){
        super(props)
        this.state = {
            messages: [],
        }
        this.updateMessages = this.updateMessages.bind(this)
    }

    componentDidMount(){
        this.updateMessages();
        this.timerID = window.setInterval(this.updateMessages, 60000)
        this._notificationSystem = this.refs.notificationSystem;
    }

    componentWillUnmount(){
        clearInterval(this.timerID)
    }

    updateMessages() {
        fetchTextMessages()
        .then(data => {
            let messages = data.map((m:any) => 
                Object.assign(
                    m,
                    {
                        date: timestampMsToReadableDate(m.updated_at),
                        msg: hexToAscii(m.msg)
                    }))
            this.setState({messages: messages.reverse()})
        })
        .catch(error => {
            this._notificationSystem.addNotification({
                message: 'Failed to fetch text messages',
                level: 'warning'
              });
        })
    }

    renderMessage(textMsg: ITextMessage){
        return (
            <tr key={textMsg.updated_at}>
                <td>{textMsg.date}</td>
                <td>{textMsg.msg}</td>
            </tr>
        )
    }

    renderMessages() {
        return this.state.messages.map(msg => this.renderMessage(msg))
    }
    render() {
        return (
        <div>
            <Table responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Content</th>
                </tr>
              </thead>
              <tbody>
                {this.renderMessages()}
              </tbody>
            </Table>
            <NotificationSystem ref="notificationSystem" />
        </div>
    )
    }
}