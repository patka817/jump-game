import React, { Component } from 'react';
import CircularProgress from 'material-ui/CircularProgress';
import LobbyList from '../lobby/LobbyList';
import HostGame from './HostGame';
import { OnInputChange, DefaultInput } from '../game/Input';
import { Mesh, Events } from '../rtcmesh';

const roomCodeOptions = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateRoomCode() {
  let code = '';
  for(let i=0; i<4; i++){
    const ndx = Math.floor(Math.random() * roomCodeOptions.length);
    code += roomCodeOptions[ndx];
  }
  return code;
}

function getOpenRoom(){
  return new Promise((resolve, reject) => {
    const code = generateRoomCode();
    let mesh = new Mesh(code);
    let resolved = false;
    mesh.on(Events.OPEN, (code) => {
      if (!resolved) {
        resolved = true;
        resolve({code, mesh});
      }
    });
    mesh.on(Events.DISCONNECTED, () => {
      if (!resolved) {
        resolved = true;
        reject();
      }
    });
  });
}

class Host extends Component {
  constructor(props){
    super(props);
    const players = {};
    players[props.name] = {
      host: true,
      ready: false,
      input: DefaultInput(),
      name: props.name
    }
    this.state = {
      players: players,
      code: null,
      gameStarted: false
    }

    this.hostName = props.name;

    this.copyPlayers = () => Object.assign({}, this.state.players);

    this.playersToArray = () => {
      const playersArr = [];
      for (const playerId in this.state.players){
        playersArr.push({
          name: this.state.players[playerId].name,
          input: this.state.players[playerId].input,
          ready: this.state.players[playerId].ready
        });
      }
      return playersArr;
    }

    this.getPlayersForGame = () => {
      // Don't send peer info
      const players = {};
      for(const playerId in this.state.players) {
        players[this.state.players[playerId].name] = {
          input: this.state.players[playerId].input
        }
      }
      return players;
    }

    // Send message to all players
    this.broadcast = (obj) => {
      this.mesh.broadcast(obj);
    }

    
    this.broadcastPlayers = () => {
      this.broadcast({
        type: 'players',
        players: this.playersToArray().map((e) => {
          return {
            name: e.name,
            ready: e.ready
          }
        })
      })
    }
    

    this.handleData = (peerId, data) => {
      switch(data.type){
        case 'ready':
          this.handleReady(peerId, data.ready);
          break;
        case 'input':
          this.handleInput(peerId, data.input);
          break;
        case 'connected':
          this.handleConnected(peerId, data.playerName);
          break;
        default:
          throw Error('Unkown input ', data.type);
      }
      return;
    }

    // Input from players
    this.handleInput = (playerId, input) => {
      const playersCopy = this.copyPlayers();
      for (const key in input) {
        playersCopy[playerId].input[key] = input[key];
      }
      this.setState({players: playersCopy});
    }

    // Input from host
    OnInputChange((input) => {
      this.handleInput(this.hostName, input);
    });

    this.handleConnected = (playerId, name) => {
      const playersCopy = this.copyPlayers();
      playersCopy[playerId] = {
        ready: false,
        input: DefaultInput(),
        name: name
      };
      
      this.setState({players: playersCopy}, () => {
        // And notify other players
        this.broadcastPlayers();
      });
    }
    
    this.handleReady = (peerId, ready) => {
      const p = this.copyPlayers();
      p[peerId].ready = ready;
      this.setState({
        players: p
      }, () => {
        // Update players of everyone's status
        this.broadcastPlayers();
        const playerArray = this.playersToArray();
        const startGame = playerArray.length === 0 ? false : (playerArray.every(p => p.ready === true ));
        if (startGame) {
          // We have enough players and they are all ready
          this.setState({gameStarted: true});
          
          // Send start game to all peers
          this.broadcast({type: 'startGame'});
        }
      });
    }
  }

  componentDidMount(){
    getOpenRoom().then(({code, mesh}) => {
      this.mesh = mesh;

      this.mesh.on(Events.RECIEVED_DATA, ({peerId, data}) => {
        this.handleData(peerId, data);
      });

      this.mesh.on(Events.PEER_DISCONNECTED, (peerId) => {
        const playersCopy = Object.assign({}, this.state.players);
        delete playersCopy[peerId];
        this.setState({players: playersCopy});
      });

      this.mesh.on(Events.PEER_CONNECTED, (id) => {
        // something..
        console.log('TODO: ?? Peer connected..');
      });
      // Display room code
      this.setState({code: code});
      });
  }

  render() {
    const codeNode = () => {
      if(this.state.code){
        return this.state.code;
      } else {
        return <CircularProgress />;
      }
    }

    // Push players into array so it's easier to work with in the game
    const playersArr = this.playersToArray();

    if(this.state.gameStarted){
      // Display the game once it starts
      return <HostGame players={this.getPlayersForGame()} broadcast={this.broadcast}/>
    } else {
      // Not enough players or not all players are ready
      return (
        <div>
          <h1>Room Code: {codeNode()}</h1>
          <LobbyList players={playersArr} checkFunction={this.handleReady.bind(this, this.hostName)}/>
        </div>
      )
    }
  }
}

export default Host;