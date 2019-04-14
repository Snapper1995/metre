import { Meteor } from 'meteor/meteor';
import * as serialport from 'serialport';
import { Ports } from '../imports/api/collections';
import { reinit } from '../imports/api/grbl';
import PortSocket from 'cncjs-pendant-boilerplate';

let gcodes = [];
const gcoderun = () => {
  if (gcodes.length) {
    const port = Ports.findOne({ active: true });
    if (port) {
      const gcode = gcodes.pop();
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
  PortSocket({
    secret: undefined,
    port: doc.port,
    baudrate: 115200,
    socketAddress: 'localhost',
    socketPort: 8000,
    controllerType: 'Grbl',
    accessTokenLifetime: '30d',
  }, Meteor.bindEnvironment((error, _socket) => {
    socket = _socket;
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