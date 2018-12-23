// @flow


import SimpleSchema from 'simpl-schema';

import Account from './fixtures/Account';
import Transaction from './fixtures/Transaction';

test('Generates a SimpleSchema definition', async () => {
  const accountSchema = Account.generateSimpleSchema();
  const transactionSchema = Transaction.generateSimpleSchema();
  const ownerIdSchema = accountSchema.ownerId;
  const sourceAccountIdSchema = transactionSchema.sourceAccountId;
  const targetAccountIdSchema = transactionSchema.targetAccountId;

  expect(Object.keys(ownerIdSchema)).toEqual(['type', 'optional', 'allowedValues', 'custom']);

  [ownerIdSchema, sourceAccountIdSchema, targetAccountIdSchema].forEach(schema => {
    expect(schema.type).toBe(String);
    if (typeof schema.optional !== 'function') {
      throw new Error('`optional` attribute must be a function');
    }
    expect(typeof schema.custom).toBe('function');
  });

  expect(ownerIdSchema.optional()).toBe(true);
  expect(sourceAccountIdSchema.optional()).toBe(false);
  expect(targetAccountIdSchema.optional()).toBe(false);
});
