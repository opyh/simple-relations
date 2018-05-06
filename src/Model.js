// @flow

import Document from './Document';
import type { MongoCompatibleCollection } from './MongoInterface';

type ModelRegistry = {
  collection: { [string]: MongoCompatibleCollection<*> },
  document: { [string]: Class<Document> },
};

const Model: ModelRegistry = {
  collection: {},
  document: {},
}

export default Model;