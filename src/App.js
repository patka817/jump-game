import React, { Component } from 'react';
import './App.css';
import HostName from './host/HostName';
import Player from './player/Player';
import Guest from './guest/Guest';
import AppBar from 'material-ui/AppBar';
import PeerJS from 'peerjs';
import Paper from 'material-ui/Paper';
//import TestGame from './testgame/TestGame';

class App extends Component {
  constructor(){
    super();
    if( true ){ // test for webrtc support
      this.state = {
        role: 'visitor'
      };
    } else {
      this.state = {
        role: 'unsupported',
        playingGame: false
      };
    }
  }

  getRoleContent = (role) => {
    if(this.state.role === 'host') {
      return <HostName/>;
    } else if (this.state.role === 'player') {
      return <Player/>;
    } else if (this.state.role === 'unsupported') {
      return (
        <div>
          Your browser does not support WebRTC Data Channel
        </div>
      );
    } else {
      return <Guest 
        becomeHost={() => this.setState({role: 'host'})}
        becomePlayer={() => this.setState({role: 'player'})}
        />;
      //return <TestGame/>
    } 
  }

  render() {
    return (
      <div>
        <AppBar
          title="Jump Game"
          titleStyle={{textAlign: "center"}}
          showMenuIconButton={false}
        />
        <Paper
          style={{
            height: '100%',
            width: '100%',
            maxHeight: 500,
            maxWidth: 600,
            margin: 'auto',
            marginTop: 25,
            padding: 20,
            textAlign: 'center'
        }}>
          {this.getRoleContent(this.state.role)}
        </Paper>
      </div>
    )
  }
}

export default App;
