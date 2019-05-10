import { Meteor } from 'meteor/meteor';
import * as serialport from 'serialport';
import { Ports } from '../imports/api/collections';
import { reinit } from '../imports/api/grbl';
import PortSocket from 'cncjs-pendant-boilerplate';

let gcodes = [];
export const gcoderun = () => {
  if (!socket) throw new Error('Cant gcoderun because broken socket');
  if (gcodes.length) {
    const port = Ports.findOne({ active: true });
    if (port) {
      const gcode = gcodes.shift();
      console.log('gcode', gcode);
      socket.emit('write', port.port, gcode + '\n');
    }
  }
};

Meteor.methods({
  [`serialports.reinit`]() {
    reinit();
  },
  [`grbl`](message) {
    var port = Ports.findOne({ active: true });
    if (port) {
      gcodes = message.split('\n');
      gcoderun();
    }
  },
});

export let socket;

const resocket = (doc) => {
  console.log('resocket start', doc);
  PortSocket({
    secret: undefined,
    port: doc.port,
    baudrate: 115200,
    socketAddress: 'localhost',
    socketPort: 8000,
    controllerType: 'Grbl',
    accessTokenLifetime: '30d',
  }, Meteor.bindEnvironment((error, _socket) => {
    if (error) throw error;
    socket = _socket;
    console.log('resocket done');
    socket.on('serialport:read', Meteor.bindEnvironment(function(data) {
      const isOk = (data || '').trim() === 'ok';
      if (isOk) gcoderun();
    }));
  }));
};

reinit((port) => resocket(port));

Ports.after.update((userId, doc, fieldNames, modifiers) => {
  if (doc.active) {
    resocket(doc);
  }
});