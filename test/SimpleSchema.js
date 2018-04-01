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

  t.deepEqual(Object.keys(ownerIdSchema), ['type', 'optional', 'custom']);

  [ownerIdSchema, sourceAccountIdSchema, targetAccountIdSchema].forEach(schema => {
    t.is(schema.type, String);
    if (typeof schema.optional !== 'function') {
      throw new Error('`optional` attribute must be a function');
    }
    t.is(schema.optional(), schema === ownerIdSchema);
    t.is(typeof schema.custom, 'function');
  });
});
