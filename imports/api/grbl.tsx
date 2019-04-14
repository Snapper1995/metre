import { Meteor } from 'meteor/meteor';
import process from 'process';
import * as serialport from 'serialport';
import { Ports } from './collections';

export function reinit(callback?) {
  serialport.list(function(err, ports) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    Ports.remove({ active: { $exists: false } });
    const activated = Ports.findOne({ active: true });
    let founded = false;
    for (let i = 0; i < ports.length; i++) {
      if (!activated || ports[i].comName !== activated.port) {
        Ports.insert({
          port: ports[i].comName,
        });
      } else founded = true;
    }
    if (!founded && activated) Ports.remove(activated._id);
    if (callback) callback(activated);
  });
};
