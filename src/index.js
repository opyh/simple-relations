// @flow

import SimpleSchema from 'simpl-schema';
import type {
  BelongsToRelation,
  BelongsToRelationMap,
  BelongsToRelationDescription,
  HasManyRelation,
  HasManyRelationMap,
  HasManyRelationDescription,
  TypesToRelationMaps,
  RelationMap,
} from './Relations';


type WithRelationProperties<T> = {
  ...T,
  relations: {},
};


export function addRelationPropertiesToDocument<T: {}>(doc: T): WithRelationProperties<T> {
  const relationProperties = {
    relations: {},
  };
  return Object.assign({}, doc, relationProperties);
}