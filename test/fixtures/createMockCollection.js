// @flow

import includes from 'lodash/includes';
import Document from '../../src/Document';
import type {
  MongoCompatibleCollection,
  MongoCompatibleCursor
} from '../../src/MongoInterface';

// Creates a collection that has a stripped-down interface of a MongoDB collection.

// Only supports very simple selectors.
function isMatchingSelector(selector: any, doc): boolean {
  if (typeof selector === 'string') return doc._id === selector;
  if (typeof selector !== 'object') throw new Error('Selector must be an object or a string');
  if (typeof selector.$and === 'object') {
    return !selector.$and.find(subSelector => !isMatchingSelector(subSelector, doc));
  }
  if (typeof selector.$or === 'object') {
    return !!selector.$or.find(subSelector => isMatchingSelector(subSelector, doc));
  }
  const keys = Object.keys(selector);
  const result = !keys.find(key => {
    const expectedValue = selector[key];
    const actualValue = doc._attributes[key];
    if (typeof expectedValue === 'object') {
      if (expectedValue.$in) {
        return !includes(expectedValue.$in, actualValue);
      }
    }
    return actualValue !== expectedValue;
  });
  // console.log('Match', selector, doc._attributes, '->', result);
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

  const find = (selector?: {} | string = {}, options?: {} = {}): MongoCompatibleCursor<T> => {
    const filteredDocuments: T[] = documents
      .filter(doc => isMatchingSelector(selector, doc));
    return {
      fetch: () => filteredDocuments,
      forEach: filteredDocuments.forEach.bind(filteredDocuments),
      map<U>(callbackfn: (value: T, index: number, array: any[]) => U, thisArg?: any): U[] {
        return filteredDocuments.map(callbackfn);
      },
      count: () => filteredDocuments.length,
    };
  }

  return {
    _name: name,
    find,
    findOne(selector?: {} | string, options?: {}): ?T {
      return find(selector, options).fetch()[0] || null;
    },
  };
}