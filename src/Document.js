// @flow

import merge from 'lodash/merge';
import memoize from 'lodash/memoize';
import lowerFirst from 'lodash/lowerFirst';

import type {
  MongoCompatibleCursor,
  MongoCompatibleCollection
} from './MongoInterface';

import { EmptyCursor } from './MongoInterface';

import {
  mHumanize,
  addIdSuffixIfNecessary,
  generateRelationFromDescription,

  type BelongsToRelation,
  type BelongsToRelationMap,
  type BelongsToRelationDescription,
  type HasManyRelation,
  type HasManyRelationMap,
  type HasManyRelationDescription,
  type TypesToRelationMaps,
  type RelationMap,
} from './Relations';

import type { FieldValidationContext } from './FieldValidationContext';


/**
 * Represents a MongoDB document with its relations (as properties).
 */

export default class Document {
  _id: ?string;
  _attributes: {
    [string]: ?any;
  };

  static relationsWithoutSuperclassRelations: ?TypesToRelationMaps;

  /**
   * @returns the Document's MongoDB collection.
   */
  static collection: ?(() => MongoCompatibleCollection<*>);

  /**
   * Initializes a `Document` object from a given MongoDB document.
   *
   * @param {*} mongoDoc MongoDB record with attributes of the document. A plain JS object.
   */
  constructor(mongoDoc: {} = {}) {
    this.constructor.checkAttributes(mongoDoc);
    this._attributes = mongoDoc;
    Object.assign(this, mongoDoc);
  }

  /**
   * Gets the current value of a given document attribute.
   *
   * @param {string} attributeName Name of the attribute whose value should be returned
   */
  get(attributeName: string) {
    return this._attributes[attributeName];
  }

  /**
   * Returns an object with all relations of this Document subclass, sorted by relation kind as keys.
   *
   * @param includeSuperclassRelations Should relations of this Document class superclasses be included in the returned relations? `true` by default.
   */
  static relations(includeSuperclassRelations: boolean = true): TypesToRelationMaps {
    if (!Object.prototype.propertyIsEnumerable.call(this, 'relationsWithoutSuperclassRelations')) {
      this.relationsWithoutSuperclassRelations = { belongsTo: {}, hasMany: {} };
    }

    if (includeSuperclassRelations) {
      return this.prototypeChain()
        .reverse()
        .map(DocumentSubclass => DocumentSubclass.relationsWithoutSuperclassRelations)
        .reduce((prev, next, index, array) => Object.assign(prev, next), {});
    }

    if (!this.relationsWithoutSuperclassRelations) {
      throw new Error('relationsWithoutSuperclassRelations not defined. This should not happen.');
    }

    return this.relationsWithoutSuperclassRelations;
  }


  /**
   * @returns a named belongs-to relation, if the definition exists.
   *
   * @param {*} name Name of the relation.
   * @param {*} includeSuperclassRelations Set this to `false` if you want to get back `null` if the
   * relation is not defined directly on the Document subclass that you call this on.
   */

  static belongsToRelation(name: string, includeSuperclassRelations: boolean = true): BelongsToRelation<*, *> {
    return this.belongsToRelations(includeSuperclassRelations)[name];
  }

  /**
   * @returns a named has-many relation, if the definition exists.
   *
   * @param {*} name Name of the relation.
   * @param {*} includeSuperclassRelations Set this to `false` if you want to get back `null` if the
   * relation is not defined directly on the Document subclass that you call this on.
   */

  static hasManyRelation(name: string, includeSuperclassRelations: boolean = true): HasManyRelation<*, *> {
    return this.hasManyRelations(includeSuperclassRelations)[name];
  }

  /**
   * @returns all defined has-many relations.
   *
   * @param {*} includeSuperclassRelations Set this to `false` if you want to get back `null` if the
   * relation is not defined directly on the Document subclass that you call this on.
   */

  static hasManyRelations(includeSuperclassRelations: boolean = true): HasManyRelationMap {
    return this.relations(includeSuperclassRelations).hasMany || {};
  }

  /**
   * @returns all defined belongs-to relations.
   * @param {*} includeSuperclassRelations Set this to `false` if you want to get back `null` if the
   * relation is not defined directly on the Document subclass that you call this on.
   */

  static belongsToRelations(includeSuperclassRelations: boolean = true): BelongsToRelationMap {
    return this.relations(includeSuperclassRelations).belongsTo || {};
  }


  /**
   * Defines belongs-to relations to other documents.
   *
   * A belongs-to relation means that database documents of this class can have a property with an
   * ID reference to a document of a second collection. Usually, there is an inverse has-many
   * relation on the second collection that ‘points back’. A bank account can *belong to* an owner,
   * in the same way the owner *has many* bank accounts.
   *
   * You can define a selector to limit fetched documents to a certain scope.
   *
   * Adding a belongs-to relations automatically adds getters to your `BankAccount` instances in
   * this example, e.g. `someBankAccount.owner.findOne()`. If you construct a `BankAccount` from a
   * database document like `{ name: 'Felix’ bank account', ownerId: 'felix' }`, this
   * `BankAccount`’s owner would be set to the document in the users collection that has
   * `{ _id: 'felix' }`.
   *
   * As a convention, all belongs-to reference properties must have the suffix `Id`. If the suffix
   * is missing, it is automatically added to the definition.
   *
   * @param {*} relationName Name of the new belongs-to relation
   * @param {*} description Object describing how the relation should work
   *
   * @example
   *     class BankAccount extends Document {
   *       owner = this.belongsTo('owner', {
   *         collection: () => users,
   *         selector: () => ({ hasPaidMembership: true }),
   *       });
   *     }
   */

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

    const baseRelation = generateRelationFromDescription({
      relationName,
      relationNameIsPlural: false,
      description,
      isHasManyRelation: false,
      documentClass: this.constructor,
    });

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
      optional: () => true,
      placeholder: () => '',
      findOneUnbound,
      findOne: findOneUnbound.bind(this),
    });

    relation = Object.assign(defaults, description);

    this.constructor._addRelations({ belongsTo: { [relationName]: relation } });

    return relation;
  }

  /**
   * Defines has-many relations from documents of this Document subclass to documents of other
   * Document subclasses.
   *
   * This means that a database document in the `scans` collection like `{ barcodeTagId: 'XYZ' }`
   * would reference the barcode tag document with `{ _id: 'XYZ' }`.
   *
   * Adding a has-many relations automatically adds getters to your `BarcodeTag` instances in this
   * example, e.g. `myBarcodeTag.scans.find().fetch()`.
   *
   * Usually a has-many relation has an inverse belongs-to relation definition on the referenced
   * document class. In the above example, this means you would additionally add a `barcodeTag`
   * belongs-to relation on a `Scan` document subclass.
   *
   * @param {*} relationName Name of the new has-many relation
   * @param {*} description Object that describes how the new relation should work
   *
   * @example
   *     class BarcodeTag extends Document {
   *       scans = this.hasMany('scans', {
   *         scans: {
   *           collection: () => scans,
   *           foreignKey: () => 'barcodeTagId',
   *         },
   *       });
   *     }
   */

  hasMany<T: Document, ThroughT: Document>(
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

    const documentClass = this.constructor;

    function findUnbound(options?: {}): MongoCompatibleCursor<T> {
      if (!relation) throw new Error('Relation must initialized before use'); // should never happen
      if (!this._id) {
        return EmptyCursor;
      }
      return documentClass.hasManyCursorForRelation(this._id, relation, options || relation.options.call(this));
    }

    const baseRelation = generateRelationFromDescription({
      relationName,
      description,
      documentClass,
      relationNameIsPlural: true,
      isHasManyRelation: true,
    });
    // console.log(baseRelation);
    const defaults: HasManyRelation<T, ThroughT> = Object.assign({}, baseRelation, {
      options: () => ({}),
      nullifyForeignRelations: () => false,
      findUnbound,
      find: findUnbound.bind(this),
    });

    relation = Object.assign(defaults, description);

    // Cache relation
    this.constructor._addRelations({ hasMany: { [relationName]: relation } });

    return relation;
  }


  /**
   * Used internally for storing the model's relation info. Please do
   * not call this directly.
   *
   * Relations are added statically to the class's prototype.
   *
   * If they were bound to the class, that class would be `Document` iteself,
   * not the subclass that the relation is defined on.
   *
   * Using this pattern lets us differentiate between relations defined on
   * each inheritance level, and also allows to sub-subclass Document
   * while keeping track which relation has been defined on which inheritance
   * hierarchy level.
   *
   * @param {*} typesToRelations Object with the relation definitions to add
   */

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

  /**
   * @returns A MongoDB cursor with all documents in the has many relation for the document with
   * the given `_id`.
   *
   * @param {*} _id `_id` of the document that the requested documents belong to.
   * @param {*} relation reference to the relation that defines which documents should be returned
   * @param {*} extendedOptions Additional options to add to the MongoDB query options when creating
   * the cursor.
   */

  static hasManyCursorForRelation<T: Document, ThroughT: Document>(
    _id: string,
    relation: HasManyRelation<T, ThroughT>,
    extendedOptions: {} = {},
  ): MongoCompatibleCursor<T> {
    const targetCollection: MongoCompatibleCollection<T> = relation.collection();
    let foreignKey = relation.foreignKey && relation.foreignKey();
    if (!foreignKey) throw new Error(`${relation.humanName} relation must have a defined foreign key`);
    foreignKey = addIdSuffixIfNecessary(foreignKey);
    const throughCollection: ?MongoCompatibleCollection<ThroughT> = relation.through && relation.through();
    let throughIds: ?string[];
    if (throughCollection) {
      let throughForeignKey = relation.throughForeignKey && relation.throughForeignKey();
      if (!throughForeignKey) throw new Error(`${relation.humanName} relation must have a defined foreign key for ‘through’ collection`);
      throughForeignKey = addIdSuffixIfNecessary(throughForeignKey);
      throughIds = throughCollection
        .find({ [throughForeignKey]: _id }, { fields: { _id: 1 }, transform: null })
        .map(doc => doc._id).filter(Boolean);
    }

    const selector = merge({}, relation.selector(),
      { [foreignKey]: throughIds ? { $in: throughIds } : _id });
    const options = merge({}, relation.options(), extendedOptions);

    return targetCollection.find(selector, options);
  }


  hasManyCursorFor(relationName: string): MongoCompatibleCursor<Document> {
    if (!this._id) return EmptyCursor;
    return this.constructor.hasManyCursorForRelation(this._id, this.constructor.hasManyRelation(relationName));
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


  static checkAttributes(mongoDoc: {}) {
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

  /**
   * Returns a [`SimpleSchema`](https://github.com/aldeed/simple-schema-js) definition to validate
   * documents of this class including their defined relations isomorphically and create forms using
   * libraries like [`uniforms`](https://github.com/vazco/uniforms) or
   * [`autoform`](https://github.com/aldeed/meteor-autoform).
   */
  static generateSimpleSchema(): {
    [string]: {
      type: Class<String>,
      optional?: (() => boolean),
      custom: (() => ?string),
    },
  } {
    const emptyDoc = new this();
    const relations = this.belongsToRelations();
    return Object
      .keys(relations)
      .map(relationName => {
        return {
          [addIdSuffixIfNecessary(relationName)]: {
            type: String,
            optional: relations[relationName].optional || (() => false),
            custom() {
              if (!this.isSet) return;
              const relation = relations[relationName];
              const selector = Object.assign({}, relation.selector(), { _id: this.value });
              const options = relation.options();
              const relatedDocument = relation.collection().findOne(selector, options);
              if (!relatedDocument) {
                return 'notAllowed'; // eslint-disable-line consistent-return
              }
            }
          }
        };
      })
      .reduce((prev, current) => Object.assign(prev, current), {});
  }
}