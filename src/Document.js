// @flow

import merge from 'lodash/merge';
import memoize from 'lodash/memoize';

import type {
  MongoCompatibleCursor,
  MongoCompatibleCollection
} from './MongoInterface';

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

import {
  mHumanize,
  generateRelationFromDescription
} from './Relations';



const addIdSuffixIfNecessary = memoize(propertyName => {
  return propertyName.match(/Id$/) ? propertyName : `${propertyName}Id`;
});

// Encapsulation of a MongoDB document with its relations (as properties).

export default class Document {
  _id: ?string;
  _attributes: {
    [string]: ?any;
  };

  static relationsWithoutSuperclassRelations: ?TypesToRelationMaps;

  constructor(mongoDoc: {} = {}) {
    this.constructor.checkAttributes(mongoDoc);
    this._attributes = mongoDoc;
    Object.assign(this, mongoDoc);
  }


  static relations(includeSuperclassRelations = true): TypesToRelationMaps {
    if (!Object.prototype.propertyIsEnumerable.call(this, 'relationsWithoutSuperclassRelations')) {
      this.relationsWithoutSuperclassRelations = { belongsTo: {}, hasMany: {} };
    }

    if (includeSuperclassRelations) {
      return this.prototypeChain()
        .reverse()
        .map(DocumentSubclass => DocumentSubclass.relationsWithoutSuperclassRelations)
        .reduce(Object.assign, {});
    }

    return this.relationsWithoutSuperclassRelations;
  }


  // Relation DSL

  static belongsToRelation(name: string, includeSuperclassRelations = true): BelongsToRelation<*, *> {
    return this.belongsToRelations(includeSuperclassRelations)[name];
  }


  static hasManyRelation(name: string, includeSuperclassRelations = true): HasManyRelation<*, *> {
    return this.hasManyRelations(includeSuperclassRelations)[name];
  }


  static hasManyRelations(includeSuperclassRelations = true): HasManyRelationMap {
    return this.relations(includeSuperclassRelations).hasMany || {};
  }


  static belongsToRelations(includeSuperclassRelations = true): BelongsToRelationMap {
    return this.relations(includeSuperclassRelations).belongsTo || {};
  }


  // Defines belongs-to relations to other documents.
  //
  // You can define a selector to limit allowed documents to a certain
  // scope that is validated when a document is saved.
  //
  //   owner = this.belongsTo('owner', {
  //     collection: Model.c.users,
  //     required: true,
  //     selector: { hasPaidMembership: true },
  //   });
  //
  // Adding a belongs-to relations automatically adds reactive getters
  // with the same names to your Doc instances (e.g.
  // `myDocument.ownerDocument()` and `myDocument.catalogItemDocument()`
  // for the previous example)

  belongsTo<T: Document, ThroughT: Document>(
    relationName: string,
    description: BelongsToRelationDescription<T, ThroughT>,
  ): BelongsToRelation<T, ThroughT> {
    const existingRelation = this.constructor.belongsToRelation(relationName);
    if (existingRelation) {
      const result = Object.assign({}, existingRelation, {
        findOne: existingRelation.findOneUnbound.bind(this),
      });
      return ((result: any): BelongsToRelation<T, ThroughT>);
    }

    const baseRelation = generateRelationFromDescription(relationName, false, description);

    let relation: ?BelongsToRelation<T, ThroughT>;

    function findOneUnbound(options?: {}): ?T {
      if (!relation) throw new Error('Relation must initialized before use'); // should never happen
      const _id = this._attributes[`${relationName}Id`];
      if (!_id) return null;
      const selector = Object.assign({}, relation.selector.call(this), { _id: String(_id) });
      const collection = relation.collection.call(this);
      return collection.findOne(selector, options || relation.options.call(this));
    }

    const defaults: BelongsToRelation<T, ThroughT> = Object.assign({}, baseRelation, {
      required: () => false,
      placeholder: () => '',
      findOneUnbound,
      findOne: findOneUnbound.bind(this),
    });

    relation = Object.assign(defaults, description);

    this.constructor._addRelations({ belongsTo: { [relationName]: relation } });

    return relation;
  }


  // Defines has-many relations from documents of this class to documents of other classes:
  //
  //   scans = this.hasMany('scans', {
  //     scans: {
  //       name: "Scans",
  //       collection: () -> scans,
  //     },
  //   });

  hasMany<T: Document, ThroughT>(
    relationName: string,
    description: HasManyRelationDescription<T, ThroughT>,
  ): HasManyRelation<T, ThroughT> {
    // Return cached relation if existent
    const existingRelation = this.constructor.hasManyRelation(relationName);
    if (existingRelation) {
      const result = Object.assign({}, existingRelation, {
        find: existingRelation.findUnbound.bind(this),
      });
      return ((result: any): HasManyRelation<T, ThroughT>);
    }

    let relation: ?HasManyRelation<T, ThroughT>;

    function findUnbound(options?: {}): MongoCompatibleCursor<T> {
      if (!relation) throw new Error('Relation must initialized before use'); // should never happen
      return this.hasManyCursorForRelation(relation, options || relation.options.call(this));
    }

    function findOneUnbound(options?: {}): ?T {
      if (!relation) throw new Error('Relation must initialized before use'); // should never happen
      const selector = this.hasManyCursorForRelation(relation, options);
      return relation.collection().findOne(selector, options || relation.options.call(this));
    }

    const baseRelation = generateRelationFromDescription(relationName, true, description);

    const defaults: HasManyRelation<T, ThroughT> = Object.assign({}, baseRelation, {
      options: () => ({}),
      nullifyForeignRelations: () => false,
      findUnbound,
      find: findUnbound.bind(this),
      findOneUnbound,
      findOne: findOneUnbound.bind(this),
    });

    relation = Object.assign(defaults, description);

    // Cache relation
    this.constructor._addRelations({ hasMany: { [relationName]: relation } });

    return relation;
  }


  // Used internally for storing the model's relation info. Please do
  // not call this directly.
  //
  // Relations are added statically to the class's prototype.
  // If they were bound to the class, that class would be Document iteself,
  // not the subclass that the relation is defined on.
  //
  // Using this pattern lets us differentiate between relations defined on
  // each inheritance level, and also allows to sub-subclass Document
  // while keeping track which relation has been defined on which inheritance
  // hierarchy level.

  static _addRelations(typesToRelations: TypesToRelationMaps): void {
    const existingRelationsAtThisClassLevel: TypesToRelationMaps = this.relations(false);
    const newRelations: TypesToRelationMaps = {};
    ['belongsTo', 'hasMany'].forEach((type: string) => {
      const relations: RelationMap = typesToRelations[type];
      newRelations[type] = Object.assign(
        existingRelationsAtThisClassLevel[type] || {},
        relations || {}
      );
      if (!relations) return;
    });
    this.relationsWithoutSuperclassRelations = newRelations;
  }


  static prototypeChain(): Class<Document>[] {
    let klass = this;
    const chain: any[] = [];
    while (klass && klass !== Function) {
      chain.push(klass);
      klass = Object.getPrototypeOf(klass);
    }
    return chain;
  }


  _throwIfBelongsToRelationNotDefined(key: string): void {
    if (!this.constructor.belongsToRelation(key)) {
      throw new Error(`No belongs-to relation '${key}' defined in the model.`);
    }
  }


  hasManyCursorForRelation<T: Document, ThroughT: Document>(
    relation: HasManyRelation<T, ThroughT>,
    extendedOptions: {} = {},
  ): MongoCompatibleCursor<T> {
    const collection: MongoCompatibleCollection<T> = relation.collection();
    let foreignKey = addIdSuffixIfNecessary(relation.foreignKey());
    const throughCollection: ?MongoCompatibleCollection<ThroughT> = relation.through && relation.through();
    let throughIds: ?string[];
    if (throughCollection) {
      let throughForeignKey = addIdSuffixIfNecessary(relation.throughForeignKey());
      throughIds = throughCollection
        .find({ [throughForeignKey]: this._id }, { fields: { _id: 1 }, transform: null })
        .map(doc => doc._id).filter(Boolean);
    }

    const selector = merge({}, relation.selector(),
      { [foreignKey]: throughIds ? { $in: throughIds } : this._id });
    const options = merge({}, relation.options(), extendedOptions);

    return collection.find(selector, options);
  }


  hasManyCursorFor(relationName: string): MongoCompatibleCursor<Document> {
    return this.hasManyCursorForRelation(this.constructor.hasManyRelation(relationName));
  }


  hasManySelector(relationName: string): {} {
    return this.constructor.hasManyRelation(relationName).selector.call(this);
  }


  hasManyOptions(relationName: string): {} {
    return this.constructor.hasManyRelation(relationName).options.call(this);
  }


  belongsToSelector(relationName: string): {} {
    return this.constructor.belongsToRelation(relationName).selector.call(this);
  }


  belongsToOptions(relationName: string): {} {
    return this.constructor.belongsToRelation(relationName).options.call(this);
  }


  static checkAttributes(mongoDoc) {
    Object.keys(this.hasManyRelations())
      .forEach(relationName => {
        if (typeof mongoDoc[relationName] !== 'undefined') {
          throw new Error(`Cannot construct Document: ‘${relationName}’ is no valid property. ‘${relationName}’ is already a defined has-many relation.`)
        }
      });

    Object.keys(this.belongsToRelations())
      .forEach(relationName => {
        if (typeof mongoDoc[relationName] !== 'undefined') {
          throw new Error(`Cannot construct Document: ‘${relationName}’ is no valid property, as there is a belongs-to relation with the same name. Did you mean to use ‘${relationName}Id’?`)
        }
      });
  }
}