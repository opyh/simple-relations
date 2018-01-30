// // @flow

// import { Meteor } from 'meteor/meteor';
// import { Mongo } from 'meteor/mongo';

// // Create a MongoDB index on the given relation attribute

// export default function createIndex(
//   collection: Mongo.Collection,
//   relationName: string,
//   index: number | string | {},
// ) {
//   if (!Meteor.isServer) { return; }
//   const indexSpec = {
//     [relationName]: (typeof index === 'undefined') ? 1 : index,
//   };
//   require('fibers')(() => { // eslint-disable-line global-require
//     if (!collection) {
//       throw new Error('Must have a defined collection before adding indexes for relations.');
//     }
//     const rawCollection = collection.rawCollection();
//     // console.log('Ensuring index', indexSpec, 'on', rawCollection.collectionName, '...');
//     const createIndexSync = Meteor.wrapAsync(rawCollection.createIndex, rawCollection);
//     createIndexSync(indexSpec);
//   }).run();
// }