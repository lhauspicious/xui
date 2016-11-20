/*
 * HTML5 GUI Framework for FreeSWITCH - XUI
 * Copyright (C) 2015-2016, Seven Du <dujinfang@x-y-t.cn>
 *
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is XUI - GUI for FreeSWITCH
 *
 * The Initial Developer of the Original Code is
 * Seven Du <dujinfang@x-y-t.cn>
 * Portions created by the Initial Developer are Copyright (C)
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Seven Du <dujinfang@x-y-t.cn>
 *
 * phone.js - The Verto Phone
 *
 */

import React from 'react';
import { NavItem } from 'react-bootstrap';


var Phone = React.createClass({
	getInitialState: function() {
		return {
			displayState: false,
			loginState: false,
			callState: "Idle",
			curCall: null,
			cidName: "Anonymouse",
			cidNum: "000000",
			dtmfVisible: false
		};
	},

	handleMenuClick: function() {
		this.setState({displayState: !this.state.displayState});
	},

	handleVertoLogin: function() {
		this.setState({loginState: true});
	},

	handleVertoDisconnect: function() {
		this.setState({loginState: false});
	},

	handleVertoDialogState: function(e) {
		var d = e.detail;

		this.setState({curCall: d});

		switch (d.state) {
		case $.verto.enum.state.ringing:
			this.setState({callState: "Ringing"});
			this.setState({cidNum: d.params.caller_id_number});
			break;
		case $.verto.enum.state.trying:
			this.setState({callState: "Trying"});
			break;
		case $.verto.enum.state.early:
			this.setState({callState: "Early"});
			break;
		case $.verto.enum.state.active:
			this.setState({callState: "Active"});
			this.setState({cidName: d.cidString()});
			break;
		case $.verto.enum.state.hangup:
			this.setState({callState: "Idle"});
			this.setState({hangupCause: d.cause});
			break;
		case $.verto.enum.state.destroy:
			this.setState({hangupCause: null});
			this.setState({curCall: null});
			break;
		case $.verto.enum.state.held:
			break;
		default:
		}
	},

	handleCall: function() {
		verto.newCall({
			destination_number: $('#dest_number').val(),
			caller_id_name: '0000',
			caller_id_number: '0000',
			useVideo: false,
			useStereo: false
		});
	},

	handleHangup: function() {
		this.state.curCall.hangup();
	},

	handleAnswer: function() {
		this.state.curCall.answer();
	},

	handleDTMF: function(e) {
		var dtmf = e.target.getAttribute("data-dtmf");

		if (!dtmf) {
			this.setState({dtmfVisible: !this.state.dtmfVisible});
		} else {
			this.state.curCall.dtmf(dtmf);
		}
	},

	componentDidMount: function() {
		window.addEventListener("verto-login", this.handleVertoLogin);
		window.addEventListener("verto-disconnect", this.handleVertoDisconnect);
		window.addEventListener("verto-dialog-state", this.handleVertoDialogState);
	},

	render: function() {
		var state;
		var hangupButton = "";
		var answerButton = "";
		var toggleDTMF = <button onClick={this.handleDTMF}>DTMF</button>;
		var DTMFs = <div style={{display: this.state.dtmfVisible ? "block" : "none"}}>
			<button onClick={this.handleDTMF} data-dtmf="0">0</button>
			<button onClick={this.handleDTMF} data-dtmf="1">1</button>
			<button onClick={this.handleDTMF} data-dtmf="2">2</button>
			<button onClick={this.handleDTMF} data-dtmf="3">3</button>
			<button onClick={this.handleDTMF} data-dtmf="4">4</button>
			<button onClick={this.handleDTMF} data-dtmf="5">5</button>
			<button onClick={this.handleDTMF} data-dtmf="6">6</button>
			<button onClick={this.handleDTMF} data-dtmf="7">7</button>
			<button onClick={this.handleDTMF} data-dtmf="8">8</button>
			<button onClick={this.handleDTMF} data-dtmf="9">9</button>
			<button onClick={this.handleDTMF} data-dtmf="*">*</button>
			<button onClick={this.handleDTMF} data-dtmf="#">#</button>
		</div>;

		if (this.state.loginState) {
			state = "Online";
		} else {
			state = "Offline"
		}

		if (this.state.callState != "Idle") {
			hangupButton = <button onClick={this.handleHangup}>Hangup</button>
		}

		if (this.state.callState == "Ringing" && this.state.cidNum != "1000") {
			$('#web-phone').css('display', 'block');
			answerButton = <button onClick={this.handleAnswer}>Answer</button>
		}

		return 	<NavItem eventKey="phone"><span id="phone-state" className={state} href="#" onClick={this.handleMenuClick}>Phone</span>
			<div id="web-phone" style={{display: this.state.displayState ? "block" : "none"}}>
				Phone....<br/>
				<input id="dest_number" name="dest_number" defaultValue="demo"/>
				<button onClick={this.handleCall}>Call</button>
				<br/>
				<span>{this.state.cidname} {this.state.callState}</span>
				{hangupButton}
				{answerButton}
				{toggleDTMF}
				{DTMFs}
			</div>
			<video id="webcam" style={{display: "none"}}/>
		</NavItem>;
	}

});

export default Phone;