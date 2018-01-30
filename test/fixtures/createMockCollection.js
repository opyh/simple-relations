// @flow

import type { MongoCompatibleCollection, MongoCompatibleCursor } from '../../src/MongoInterface';
import Document from '../../src/Document';

// Only supports very simple selectors
function isMatchingSelector(selector, doc) {
  const keys = Object.keys(selector);
  const result = !keys.find(key => doc._attributes[key] !== selector[key]);
  console.log('Match', selector, doc._attributes, '->', result);
  return result;
}

export default function createMockCollection<T: Document>(
  name: string,
  idsToDocumentsWithoutIdAttributes: { [string]: T }
): MongoCompatibleCollection<T> {
  // Add missing _id attributes to the input documents
  const idsToDocuments = {};
  const documents: T[] = [];

  Object.keys(idsToDocumentsWithoutIdAttributes).forEach(_id => {
    const doc = idsToDocumentsWithoutIdAttributes[_id];
    Object.assign(doc, { _id });
    Object.assign(doc._attributes, { _id });
    idsToDocuments[_id] = doc;
    documents.push(doc);
  });

  return {
    _name: name,

    findOne(selector?: {}, options?: {}): ?T {
      if (!selector) return idsToDocuments[Object.keys(idsToDocuments)[0]];
      if (typeof selector === 'string') return idsToDocuments[selector];
      if (typeof selector._id === 'string') return idsToDocuments[selector._id];
      return null;
    },

    find(selector?: {} = {}, options?: {} = {}): MongoCompatibleCursor<T> {
      return {
        fetch() {
          return Object.keys(idsToDocuments)
            .map(key => idsToDocuments[key])
            .filter(doc => isMatchingSelector(selector, doc));
        },
        forEach: (fn: (T => void)) => documents.forEach(fn),
        map: documents.map.bind(documents),
      };
    }
  };
}