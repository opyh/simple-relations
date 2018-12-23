// @flow
import { singularize, pluralize } from 'inflection';
import humanize from 'underscore.string/humanize';
import memoize from 'lodash/memoize';
import lowerFirst from 'lodash/lowerFirst';
import type { MongoCompatibleCursor, MongoCompatibleCollection } from './MongoInterface';
import type Document from './Document';

export const mHumanize: ((string) => string) = memoize(humanize);
export const mSingularize: ((string) => string) = memoize(singularize);
export const mPluralize: ((string) => string) = memoize(pluralize);

// Useful if somebody forgets to add an 'Id' suffix to their foreign key.
// Memoized for speed.
export const addIdSuffixIfNecessary = memoize((propertyName: string) => {
  return lowerFirst(propertyName.match(/Id$/) ? propertyName : `${propertyName}Id`);
});

export type Relation<T, ThroughT> = {
  collection: () => MongoCompatibleCollection<T>,
  selector: () => {},
  options: () => {},
  through?: () => MongoCompatibleCollection<ThroughT>,
  foreignKey: () => string,
  throughForeignKey: () => string,
  name: string,
  humanName: string,
  humanNameSingular: string,
  humanNamePlural: string,
  humanCollectionName: () => string,
  humanCollectionNameSingular: () => string,
  helpText: () => string,
}
/**
 * Describes a relation between a document and one or more other documents.
 */

export type RelationDescription<T, ThroughT> = {
  collection: () => MongoCompatibleCollection<T>,
  selector?: () => {},
  options?: () => {},
  humanName?: string,
  humanNameSingular?: string,
  humanNamePlural?: string,
  humanCollectionName?: () => string,
  humanCollectionNameSingular?: () => string,
  helpText?: () => string,
  through?: () => MongoCompatibleCollection<ThroughT>,
  foreignKey?: () => string,
  throughForeignKey?: () => string,
};


export type BelongsToRelationDescription<T, ThroughT> = {
  collection: () => MongoCompatibleCollection<T>,
  selector?: () => {},
  options?: () => {},
  humanName?: string,
  humanNameSingular?: string,
  humanNamePlural?: string,
  humanCollectionName?: () => string,
  humanCollectionNameSingular?: () => string,
  helpText?: () => string,
  through?: () => MongoCompatibleCollection<ThroughT>,
  foreignKey?: () => string,
  throughForeignKey?: () => string,
  optional?: () => boolean,
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
  foreignKey: () => string,
  throughForeignKey: () => string,
  optional: () => boolean,
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
  foreignKey?: () => string,
  throughForeignKey?: () => string,
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
  foreignKey?: () => string,
  throughForeignKey: () => string,
  name: string,
  humanName: string,
  humanNameSingular: string,
  humanNamePlural: string,
  humanCollectionName: () => string,
  humanCollectionNameSingular: () => string,
  helpText: () => string,
  findUnbound: (options?: {}) => MongoCompatibleCursor<T>,
  find: (options?: {}) => MongoCompatibleCursor<T>,
  nullifyForeignRelations: () => boolean,
};


export function generateRelationFromDescription<T, ThroughT, SourceT>(
  {
    relationName,
    relationNameIsPlural,
    description,
    isHasManyRelation,
    documentClass,
  }: {
    relationName: string,
    relationNameIsPlural: boolean,
    description: RelationDescription<T, ThroughT>,
    isHasManyRelation: boolean,
    documentClass: Class<Document>,
  }
): Relation<T, ThroughT> {
  const through = description.through;
  const targetCollectionNameFn = () => description.collection()._name;
  const sourceCollectionNameFn = () => {
    if (!documentClass) throw new Error(`Source document class must be defined for has-many relation "${relationName}".`);
    const sourceCollectionFn = documentClass.collection;
    if (!sourceCollectionFn) throw new Error(`Source collection must be defined for has-many relation "${relationName}". Please add a 'collection' method to your ${documentClass.name} class that returns the collection.`);
    return typeof sourceCollectionFn === 'function' && sourceCollectionFn()._name;
  };
  const throughCollectionNameFn = through && (() => through()._name);

  const humanName: string = description.humanName || mHumanize(relationName);
  const humanNameSingular = relationNameIsPlural ? mPluralize(humanName) : humanName;
  const humanNamePlural = relationNameIsPlural ? humanName : mPluralize(humanName);

  const foreignKey: (() => string) = () => {
    if (description.foreignKey) {
      const customizedForeignKey = description.foreignKey();
      if (customizedForeignKey) return customizedForeignKey;
    }
    let name;
    if (throughCollectionNameFn) {
      name = throughCollectionNameFn();
    }
    if (!name && isHasManyRelation) {
      name = sourceCollectionNameFn();
    }
    if (!name) {
      name = targetCollectionNameFn();
    }
    if (name) {
      return addIdSuffixIfNecessary(mSingularize(name));
    }
    throw new Error('Neither source, nor target, nor through collection seems to have a name. Huh?');
  }

  return Object.assign({
    collection: description.collection,
    through: description.through,
    name: relationName,
    foreignKey,
    humanName,
    humanNamePlural,
    humanNameSingular,
    humanCollectionName: () => mHumanize(targetCollectionNameFn()),
    humanCollectionNameSingular: () => mHumanize(mSingularize(targetCollectionNameFn())),
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
