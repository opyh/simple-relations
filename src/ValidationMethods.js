// class ValidationMethods {
//   // Perform all necessary validation on a given belongs-to relation.

//   _validateBelongsToRelation(relationName: string): void {
//     const relation: BelongsToRelation<*> = this.constructor.belongsToRelation(relationName);
//     if (!relation) { return; }
//     const foreignId = this[`${relationName}Id`];
//     if (foreignId) {
//       if (typeof foreignId !== 'string') {
//         throw new Error('Foreign id must be a string.');
//       }
//       this.__validateBelongsToRelationAllowed(relationName, relation, foreignId);
//     }
//     this.__validateBelongsToRelationNotNull(relationName, relation, null);
//   }


//   // Check if the referenced object is allowed for this relation.

//   __validateBelongsToRelationAllowed(
//     relationName: string,
//     relation: BelongsToRelation<*>,
//     foreignId: string,
//   ): void {
//     if (foreignId == null) { return; }

//     const scopedSelector: {} = { _id: foreignId };
//     const belongsToSelector: {} = this.belongsToSelector(relationName);
//     Object.assign(scopedSelector, belongsToSelector);
//     const collection: ValidatingCollection<*> = relation.collection();
//     if (!collection) {
//       throw new Error(`${relation.humanName} relation on ${this.constructor.name} has no collection set`);
//     }
//     const foundDocument: ?{} = collection.findOneUntransformed(scopedSelector);
//     if (foundDocument) {
//       return;
//     }
//     let message;
//     const humanCollectionName: string = relation.humanCollectionNameSingular;
//     const humanRelationName: string = relation.humanName;
//     if (humanRelationName === humanCollectionName) {
//       message = 'Please select something else here.';
//     } else {
//       message = `Sorry, this ${humanCollectionName} cannot be selected as ${humanRelationName}.`;
//     }

//     this.addError(relationName, { message, context: 'checking allowed belongs-to associations' });

//     console.log(`Foreign id: ${foreignId}, allowed: ${JSON.stringify(scopedSelector)} from collection: ${collection._name}`);
//   }


//   // Check if the referenced object is not null.

//   __validateBelongsToRelationNotNull(
//     relationName: string,
//     relation: BelongsToRelation<*>,
//     foreignId: ?string,
//   ): void {
//     if (relation.required()) {
//       if (!foreignId) {
//         this.addError(relationName, { message: 'Please select', context: 'checking if attribute is there' });
//       }
//     }
//   }

// }