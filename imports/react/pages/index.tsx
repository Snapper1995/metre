import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import * as React from 'react';
import _ from 'lodash';
import { withTracker } from 'meteor/react-meteor-data';

// @ts-ignore
import { withStyles } from '@material-ui/core/styles';
import { PlayArrow, Clear, Create, ChevronLeft, Refresh, PhotoCamera, FullscreenExit } from '@material-ui/icons';

import { Users, Ports } from '../../api/collections/index';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';

import Camera from 'react-html5-camera-photo';
import svgcode from 'svgcode';

import { DrawCanvas } from '../components/draw';
import { Cropper } from '../components/cropper';

class Component extends React.Component <any, any, any>{
  state = {
    croppedPhoto: null,
    originPhoto: null,
    width: 0,
    height: 0,
    paths: [ [] ],
    minX: 12,
    minY: 20,
    maxX: 57,
    maxY: 57,
    wH: typeof(window) === 'object' ? window.innerHeight - 64 : 0,
    wW: typeof(window) === 'object' ? window.innerWidth : 0,
  };

  takePhoto = () => this.setState({ croppedPhoto: null, originPhoto: null });
  savePhoto = (key, photo) => {
    var img = new Image()
    img.onload = () => {
      this.setState({ [key]: photo, width: img.width, height: img.height });
    };
    img.src = photo;
  };

  calc = (from, to, value) => {
    var fromOne = (from / 100);
    var toOne = (to / 100);
    return (value / fromOne) * toOne;
  };

  clear = () => this.setState({ paths: [ [] ] });
  refresh = () => Meteor.call('grbl', 'G90 G0 X0 Y0 Z0');
  center = () => Meteor.call('grbl', 'G90 G0 X25 Y25 Z0');
  min = () => Meteor.call('grbl', `G90 G0 X${this.state.minX} Y${this.state.minY} Z0`);
  max = () => Meteor.call('grbl', `G90 G0 X${this.state.maxX} Y${this.state.maxY} Z0`);
  play = () => {
    const { minX, minY, maxX, maxY, wH, wW } = this.state;

    const aW = maxX - minX;
    const aH = maxY - minY;

    const paths = this.state.paths.map(_points => {
      let path = '';
      let points = _points.slice(0);
      if (points.length > 0) {
        path = `M ${this.calc(wW, aW, points[0].x) + minX} ${this.calc(wH, aH, points[0].y) + minY}`;
        var p1, p2, end;
        for (var i = 1; i < points.length - 2; i += 2) {
          p1 = points[i];
          p2 = points[i + 1];
          end = points[i + 2];
          path += ` C ${this.calc(wW, aW, p1.x) + minX} ${this.calc(wH, aH, p1.y) + minY}, ${this.calc(wW, aW, p2.x) + minX} ${this.calc(wH, aH, p2.y) + minY}, ${this.calc(wW, aW, end.x) + minX} ${this.calc(wH, aH, end.y) + minY}`;
        }
      }
      return path;
    }).filter(p => p !== '');
    
    const svgPaths = paths.map(path => {
      return `<path
        stroke="black"
        strokeWidth="2"
        d="${path}"
        fill="none"
      />`;
    }).join('');

    const svg = `<svg>${svgPaths}</svg>`;

    console.log(svg);
    
    const gc = svgcode();
    gc.svgFile = svg;

    const agc = gc
    .generateGcode()
    .getGcode();

    agc.splice(3, 1);
    agc.splice(agc.length - 1, 1);
    agc.push(`G0 X0 Y0`);
    let sgc = agc.join('\n');
    sgc = sgc.replace(/ Z-10/g, '');
    sgc = sgc.replace(/G1/g, 'G0');

    console.log(sgc);
    Meteor.call('grbl', sgc);
  }

  onChange = (paths) => this.setState({ paths });

  render() {
    const { ports } = this.props;
    const { minX, minY, maxX, maxY, wH, wW } = this.state;

    const activated = Ports.findOne({ active: true });
    const active = (activated && activated._id) || '';

    const aW = maxX - minX;
    const aH = maxY - minY;

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
          <IconButton onClick={this.min}>
            <ChevronLeft style={{ transform: 'rotate(45deg)' }}/>
          </IconButton>
          <IconButton onClick={this.max}>
            <ChevronLeft style={{ transform: 'rotate(225deg)' }}/>
          </IconButton>
          <IconButton>
            <Create/>
          </IconButton>
          <IconButton onClick={this.clear}>
            <Clear/>
          </IconButton>
          <IconButton onClick={this.play}>
            <PlayArrow/>
          </IconButton>
          <TextField
            label='maxX'
            value={this.state.maxX}
            type="number"
            style={{ width: 50 }}
            onChange={e => this.setState({ maxX: e.target.value })}
          />
          <TextField
            label='maxY'
            value={this.state.maxY}
            type="number"
            style={{ width: 50 }}
            onChange={e => this.setState({ maxY: e.target.value })}
          />
          <TextField
            label='minX'
            value={this.state.minX}
            type="number"
            style={{ width: 50 }}
            onChange={e => this.setState({ minX: e.target.value })}
          />
          <TextField
            label='minY'
            value={this.state.minY}
            type="number"
            style={{ width: 50 }}
            onChange={e => this.setState({ minY: e.target.value })}
          />
        </Toolbar>
      </AppBar>
      <div style={{ position: 'absolute', top: 64, left: 0, height: 'calc(100% - 64px)', width: '100%' }}>
        {Meteor.isClient && (this.state.croppedPhoto
          ? <React.Fragment>
            <DrawCanvas
              paths={this.state.paths}
              onChange={this.onChange}
              image={this.state.croppedPhoto}
              width={wW}
              height={wH}
              style={{ position: 'absolute', top: `calc(50% - ${wH / 2}px)`, left: `calc(50% - ${wW / 2}px)` }}
            />
            <div style={{
              pointerEvents: 'none',
              position: 'absolute',
              left: `calc(50% - ${wW / 2}px)`,
              top: `calc(50% - ${wH / 2}px)`,
              width: wW,
              height: wH,
              boxShadow: `0 0 0 2px black`,
            }}></div>
          </React.Fragment>
          : this.state.originPhoto
          ? <Cropper src={this.state.originPhoto} onCropped={(photo) => this.savePhoto('croppedPhoto', photo)}/>
          : <Camera onTakePhoto = {(photo) => this.savePhoto('originPhoto', photo)}/>
        )}
      </div>
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
