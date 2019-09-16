import React, { Component } from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import DisplayGame from './DisplayGame';
import LobbyList from '../lobby/LobbyList';
import { OnInputChange } from '../game/Input';
import CircularProgress from 'material-ui/CircularProgress';
import { Mesh, Events } from '../rtcmesh';

class Player extends Component {
  constructor() {
    super();
    this.state = {
      hostCode: '',
      name: '',
      connected: false,
      connecting: false,
      gameStarted: false,
      error: '',
      host: null,
      players: [],
      gameState: {
        sprites: []
      }
    }

    this.mesh = null;

    this.sendReady = (ready) => {
      this.mesh.broadcast({
        type: 'ready',
        ready: ready
      });
    }

    this.handleData = (data) => {
        switch(data.type){
          case 'startGame':
            this.setState({gameStarted: true});
            break;
          case 'players':
            this.setState({players: data.players});
            break;
          case 'gameUpdate':
            this.trackInputs();
            this.setState({gameState: data.gameState});
            break;
          default:
            throw Error('Unknown input ', data.type);
        }
        return;
    }

    this.trackInputs = () => {
      OnInputChange((input) => {
        this.mesh.broadcast({
          type: 'input',
          input: input
        })
      });
    }
  }

  joinGame = () => {
    this.setState({error: '', connecting: true});
    const {hostCode, name } = this.state;
        this.mesh = new Mesh();
        this.mesh.on(Events.PEER_CONNECTED, (peerId) => {
          console.log('whoot');
        });
        this.mesh.on(Events.RECIEVED_DATA, ({peerId, data}) => {
            this.handleData(data);
        });
        this.mesh.on(Events.PEER_DISCONNECTED, (peerId) => {
          if (peerId === hostCode) {
            this.setState({
              gameStarted: false,
              connected: false,
              error: 'Disconnected from host',
              hostCode: ''
            });
          }
        });

        this.mesh.connectToPeer(hostCode).then(() => {
          this.setState({connected: true, connecting: false})
          this.mesh.sendTo(hostCode, {type: 'connected', playerName: name});
        }).catch(() => {
          console.error('failed to connect to host');
          this.setState({
            gameStarted: false,
            connected: false,
            error: 'Disconnected from host',
            hostCode: ''
          });
        });      
  }

  render() {
    if(this.state.connected){
      if(this.state.gameStarted){
        return <DisplayGame gameState={this.state.gameState} />
      } else {
        return <LobbyList players={this.state.players} checkFunction={this.sendReady} />
      }
    } else {
      if(this.state.connecting){
        return <CircularProgress size={80} thickness={5} />
      } else {
        return (
          <div>
            <h1>Join a Game</h1>
            <TextField
              hintText='Room hostCode'
              floatingLabelText='Room hostCode'
              maxLength='4'
              value={this.state.hostCode}
              onChange={(_, v) => this.setState({hostCode: v.toUpperCase()})}
              errorText={this.state.error}
            />
            <br />
            <TextField
              hintText='Username'
              floatingLabelText='Username'
              maxLength='16'
              value={this.state.name}
              onChange={(_, v) => this.setState({name: v})}
            />
            <br/>
            <RaisedButton
              label='Join'
              primary={true}
              onClick={this.joinGame}
            />
          </div>
        );
      }
    }
  }
}

export default Player;
