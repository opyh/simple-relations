// @flow
import { singularize, pluralize } from 'inflection';
import humanize from 'underscore.string/humanize';
import memoize from 'lodash/memoize';
import type { MongoCompatibleCursor, MongoCompatibleCollection } from './MongoInterface';

export const mHumanize = memoize(humanize);
export const mSingularize = memoize(singularize);
export const mPluralize = memoize(pluralize);


export type Relation<T, ThroughT> = {
  collection: () => MongoCompatibleCollection<T>,
  selector: () => {},
  options: () => {},
  through?: () => MongoCompatibleCollection<ThroughT>,
  foreignKey: () => $Keys<typeof T>,
  throughForeignKey: () => $Keys<typeof ThroughT>,
  name: string,
  humanName: string,
  humanNameSingular: string,
  humanNamePlural: string,
  humanCollectionName: () => string,
  humanCollectionNameSingular: () => string,
  helpText: () => string,
}


export type RelationDescription<T, ThroughT> = {
  collection: () => MongoCompatibleCollection<T>,
  selector?: () => {},
  options?: () => {},
  name: string,
  humanName?: string,
  humanNameSingular?: string,
  humanNamePlural?: string,
  humanCollectionName?: () => string,
  humanCollectionNameSingular?: () => string,
  helpText?: () => string,
  through?: () => MongoCompatibleCollection<ThroughT>,
  foreignKey?: () => $Keys<typeof T>,
  throughForeignKey?: () => $Keys<typeof ThroughT>,
};


export type BelongsToRelationDescription<T, ThroughT> = {
  collection: () => MongoCompatibleCollection<T>,
  selector?: () => {},
  options?: () => {},
  name: string,
  humanName?: string,
  humanNameSingular?: string,
  humanNamePlural?: string,
  humanCollectionName?: () => string,
  humanCollectionNameSingular?: () => string,
  helpText?: () => string,
  through?: () => MongoCompatibleCollection<ThroughT>,
  foreignKey?: () => $Keys<typeof T>,
  throughForeignKey?: () => $Keys<typeof ThroughT>,
  required?: () => boolean,
  placeholder?: () => string,
  index?: number | string | {},
};


export type BelongsToRelation<T, ThroughT> = {
  collection: () => MongoCompatibleCollection<T>,
  selector: () => {},
  options: () => {},
  name: string,
  humanName: string,
  humanNameSingular: string,
  humanNamePlural: string,
  humanCollectionName: () => string,
  humanCollectionNameSingular: () => string,
  helpText: () => string,
  through?: () => MongoCompatibleCollection<ThroughT>,
  foreignKey: () => $Keys<typeof T>,
  throughForeignKey: () => $Keys<typeof ThroughT>,
  required: () => boolean,
  findOneUnbound: (options?: {}) => ?T,
  findOne: (options?: {}) => ?T,
  placeholder: () => string,
  index?: number | string | {},
};


export type HasManyRelationDescription<T, ThroughT> = {
  collection: () => MongoCompatibleCollection<T>,
  selector?: () => {},
  options?: () => {},
  through?: () => MongoCompatibleCollection<ThroughT>,
  foreignKey?: () => $Keys<typeof T>,
  throughForeignKey?: () => $Keys<typeof ThroughT>,
  name: string,
  humanName?: string,
  humanNameSingular?: string,
  humanNamePlural?: string,
  humanCollectionName?: () => string,
  humanCollectionNameSingular?: () => string,
  helpText?: () => string,
  nullifyForeignRelations?: () => boolean,
};


export type HasManyRelation<T, ThroughT> = {
  collection: () => MongoCompatibleCollection<T>,
  selector: () => {},
  options: () => {},
  through?: () => MongoCompatibleCollection<ThroughT>,
  foreignKey: () => $Keys<typeof T>,
  throughForeignKey: () => $Keys<typeof ThroughT>,
  name: string,
  humanName: string,
  humanNameSingular: string,
  humanNamePlural: string,
  humanCollectionName: () => string,
  humanCollectionNameSingular: () => string,
  helpText: () => string,
  findUnbound: (options?: {}) => MongoCompatibleCursor<T>,
  find: (options?: {}) => MongoCompatibleCursor<T>,
  findOneUnbound: (options?: {}) => ?T,
  findOne: (options?: {}) => ?T,
  nullifyForeignRelations: () => boolean,
};


export function generateRelationFromDescription<T, ThroughT>(
  relationName: string,
  relationNameIsPlural: boolean,
  description: RelationDescription<T, ThroughT>,
): Relation<T, ThroughT> {
  const collectionName = () => description.collection()._name;
  const collectionSingularName = () => mSingularize(collectionName());
  const humanName: string = description.humanName || mHumanize(relationName);
  const humanNameSingular = relationNameIsPlural ? mPluralize(humanName) : humanName;
  const humanNamePlural = relationNameIsPlural ? humanName : mPluralize(humanName);
  const through = description.through;

  return Object.assign({
    collection: description.collection,
    through: description.through,
    name: relationName,
    humanName,
    humanNamePlural,
    humanNameSingular,
    humanCollectionName: () => mHumanize(collectionName()),
    humanCollectionNameSingular: () => mHumanize(collectionSingularName()),
    foreignKey: through ? (() => mSingularize(through()._name)) : (() => collectionSingularName),
    throughForeignKey: through ?
      () => through ? mSingularize(through()._name) : null
    :
      () => { throw new Error('Relation has no \'through\' collection set.'); },
    selector: () => ({}),
    options: () => ({}),
    helpText: () => '',
    placeholder: () => '',
  }, description);
}

export type BelongsToRelationMap = { [string]: BelongsToRelation<*, *> };
export type HasManyRelationMap = { [string]: HasManyRelation<*, *> };
export type TypesToRelationMaps = {
  belongsTo?: BelongsToRelationMap,
  hasMany?: HasManyRelationMap
};
export type RelationMap = { [string]: RelationDescription<*> };
