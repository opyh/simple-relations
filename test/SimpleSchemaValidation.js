// @flow

import test from 'ava';
import omit from 'lodash/omit';
import SimpleSchema from 'simpl-schema';
import createMockCollection from './fixtures/createMockCollection';
import Document from '../src/Document';
import type { BelongsToRelation } from '../src/Relations';


// Setup a mock collection
const startups = createMockCollection('startups', { FooHub: new Document({ name: 'FooHub', claim: 'Like Uber, but for quick brown foxes.' }) });

// Define test configurations. Each line represents a test for a configuration of a SimpleSchema field.
const fieldConfigurations = [
  { isSet: false, optional: true,                     error: undefined },
  { isSet: true,  optional: true, idIsCorrect: false, error: 'notAllowed' },
  { isSet: true,  optional: true, idIsCorrect: true,  error: undefined },
  { isSet: false, optional: false,                      error: SimpleSchema.ErrorTypes.REQUIRED },
  { isSet: true,  optional: false,  idIsCorrect: false, error: 'notAllowed' },
  { isSet: true,  optional: false,  idIsCorrect: true,  error: undefined },
];


let i = 0;
for (const config of fieldConfigurations) {
  test(`Validation case ${i += 1}: ${JSON.stringify(config.error)} result for validating belongs-to relation with setup ${JSON.stringify(omit(config, 'error'))}`, (t) => {
    const Hipster = class extends Document {
      startup: BelongsToRelation<Document, *> = this.belongsTo('startup', {
        collection: () => startups,
        optional: () => config.optional,
      });
    };

    const hipsterProperties = {};
    if (config.isSet) {
      hipsterProperties.startupId = config.idIsCorrect ? 'FooHub' : 'Wrongly';
    }

    const schema = Hipster.generateSimpleSchema();
    const simpleSchema = new SimpleSchema(schema);
    const validationContext = simpleSchema.newContext();
    console.log('schema', schema, 'props', hipsterProperties);
    const isValid = validationContext.validate(hipsterProperties);
    t.is(isValid, !config.error);
    if (config.error) {
      const expectedValue = (config.isSet ? 'Wrongly' : undefined);
      t.deepEqual(validationContext.validationErrors(), [{ name: 'startupId', type: config.error, value: expectedValue }]);
    } else {
      t.deepEqual(validationContext.validationErrors(), []);
    }
  });
}

