import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import * as React from 'react';
import _ from 'lodash';
import { withTracker } from 'meteor/react-meteor-data';

// @ts-ignore
import { withStyles } from '@material-ui/core/styles';
import { PlayArrow, Clear, Create, Refresh, PhotoCamera, FullscreenExit } from '@material-ui/icons';

import { Users, Ports } from '../../api/collections/index';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import Camera from 'react-html5-camera-photo';

import { gcode } from '../../gcode';

class Drawing extends React.Component <any, any, any> {
  componentDidMount() {
    // @ts-ignore
    const draw = new SVG('drawing');

    // draw
    // .size('100%', '100%')
    // .polygon().draw();
        
    console.log(draw);

    // draw.on('drawstart', function(e){
    //   document.addEventListener('keydown', function(e){
    //     if(e.keyCode == 13){
    //       draw.draw('done');
    //       draw.off('drawstart');
    //     }
    //   });
    // });
    
    // draw.on('drawstop', function(){
    //     // remove listener
    // });
  }
  render() {
    return <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
      }}
    >
      <img
        src={this.props.image}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          top: 0,
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          top: 0,
        }}
        id="drawing"
      ></div>
    </div>;
  }
}

class Component extends React.Component <any, any, any>{
  state = {
    photoUri: null,
  };

  takePhoto = () => this.setState({ photoUri: null });
  savePhoto = (photoUri) => this.setState({ photoUri });

  refresh = () => Meteor.call('grbl', 'G90 G0 X0 Y0 Z0');
  center = () => Meteor.call('grbl', 'G90 G0 X25 Y25 Z0');
  play = () => Meteor.call('grbl', gcode);

  render() {
    const { ports } = this.props;

    const activated = Ports.findOne({ active: true });
    const active = (activated && activated._id) || '';

    return <div>
      <AppBar style={{ background: 'white' }}>
        <Toolbar>
          <Select
            style={{ minWidth: 150 }}
            value={active}
            onChange={(event) => Ports.update(event.target.value, { $set: { active: true } })}
          >
            {ports.map(port => {
              return <MenuItem
                key={port._id}
                value={port._id}
              >
                {port.port}
              </MenuItem>;
            })}
          </Select>
          <IconButton onClick={this.takePhoto}>
            <PhotoCamera/>
          </IconButton>
          <IconButton onClick={this.refresh}>
            <Refresh/>
          </IconButton>
          <IconButton onClick={this.center}>
            <FullscreenExit/>
          </IconButton>
          <IconButton>
            <Create/>
          </IconButton>
          <IconButton>
            <Clear/>
          </IconButton>
          <IconButton onClick={this.play}>
            <PlayArrow/>
          </IconButton>
        </Toolbar>
      </AppBar>
      {Meteor.isClient && (this.state.photoUri
        ? <Drawing image={this.state.photoUri}/>
        : <Camera onTakePhoto = {(photoUri) => this.savePhoto(photoUri)}/>
      )}
    </div>;
  }
}

const tracked = withTracker((props) => {
  const ports = Ports.find({});
  return {
    ...props,
    ports: ports.fetch(),
  };
})((props: any) => <Component {...props}/>);

const styled = withStyles(theme => ({}))(tracked);

export default styled;
