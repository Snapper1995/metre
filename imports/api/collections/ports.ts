import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import _ from 'lodash';

import { wrapCollection } from '../collection';

export interface IPort {
  _id?: string;
  port?: string;
  active?: boolean;
}

export const Ports = wrapCollection(new Mongo.Collection<IPort>('ports'));
export default Ports;

if (Meteor.isServer) {
  Meteor.publish('ports', function(query, options) {
    this.autorun(function() {
      return Ports.find(query, options);
    });
  });

  Ports.allow({
    insert(userId, doc) {
      return true;
    },
    update(userId, doc, fieldNames, modifier) {
      if (fieldNames.includes('active')) {
        Ports.update(
          {
            _id: { $ne: doc._id },
            active: { $exists: true },
          },
          {
            $unset: {
              active: true,
            },
          },
        );
      }
      return true;
    },
    remove(userId, doc) {
      return true;
    },
  });
}
