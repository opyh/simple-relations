// @flow

import test from 'ava';
import SimpleSchema from 'simpl-schema';

import Account from './fixtures/Account';
import Transaction from './fixtures/Transaction';

test('Generates a SimpleSchema definition', t => {
  const accountSchema = Account.generateSimpleSchema();
  const transactionSchema = Transaction.generateSimpleSchema();
  const ownerIdSchema = accountSchema.ownerId;
  const sourceAccountIdSchema = transactionSchema.sourceAccountId;
  const targetAccountIdSchema = transactionSchema.targetAccountId;

  t.deepEqual(Object.keys(ownerIdSchema), ['type', 'optional', 'allowedValues', 'custom']);

  [ownerIdSchema, sourceAccountIdSchema, targetAccountIdSchema].forEach(schema => {
    t.is(schema.type, String);
    if (typeof schema.optional !== 'function') {
      throw new Error('`optional` attribute must be a function');
    }
    t.is(typeof schema.custom, 'function');
  });

  t.is(ownerIdSchema.optional(), true);
  t.is(sourceAccountIdSchema.optional(), false);
  t.is(targetAccountIdSchema.optional(), false);
});
