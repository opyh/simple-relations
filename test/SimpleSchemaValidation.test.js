// @flow


import omit from 'lodash/omit';
import SimpleSchema from 'simpl-schema';
import createMockCollection from './fixtures/createMockCollection';
import Document from '../src/Document';
import type { BelongsToRelation } from '../src/Relations';


// Setup a mock collection
const startups = createMockCollection('startups', {
  FooHub: new Document({ name: 'FooHub', claim: 'Like BarHub, but for foos.' }),
  BarHub: new Document({ name: 'BarHub', claim: 'Like FooHub, but for bars.' }),
});

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
  test(`Validation case ${i += 1}: ${JSON.stringify(config.error)} result for validating belongs-to relation with setup ${JSON.stringify(omit(config, 'error'))}`, async () => {
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
    const isValid = validationContext.validate(hipsterProperties);
    expect(isValid).toEqual(!config.error);
    if (config.error) {
      const expectedValue = (config.isSet ? 'Wrongly' : undefined);
      expect(validationContext.validationErrors()).toMatchObject([{ name: 'startupId', type: config.error, value: expectedValue }]);
    } else {
      expect(validationContext.validationErrors()).toMatchObject([]);
    }
  });
}

test('belongs-to `allowedIds` are validated correctly', async () => {
  const Hipster = class extends Document {
    startup: BelongsToRelation<Document, *> = this.belongsTo('startup', {
      collection: () => startups,
      allowedIds: () => ['FooHub'],
    })
  };

  const schema = Hipster.generateSimpleSchema();
  const simpleSchema = new SimpleSchema(schema);
  const validationContext = simpleSchema.newContext();

  expect(validationContext.validate({ startupId: 'FooHub' })).toBe(true);
  expect(validationContext.validationErrors()).toHaveLength(0);

  expect(validationContext.validate({ startupId: 'BarHub' })).toBe(false);
  expect(validationContext.validationErrors()).toEqual([ { name: 'startupId', type: 'notAllowed', value: 'BarHub' } ]);
});