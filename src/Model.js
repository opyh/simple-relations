// @flow

import Document from './Document';
import type { MongoCompatibleCollection } from './MongoInterface';

type ModelRegistry = {
  collection: { [string]: MongoCompatibleCollection<*> },
  document: { [string]: Class<Document> },
};

/**
 * A central object to register `Document` subclasses and their collections by name.
 */
const Model: ModelRegistry = {
  collection: {},
  document: {},
}

export default Model;