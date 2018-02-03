// @flow

import test from 'ava';

import Account from './fixtures/Account';
import Transaction from './fixtures/Transaction';


test('Can generates a SimpleSchema definition', t => {
  t.deepEqual(
    Account.generateSimpleSchema(),
    { ownerId: { type: String } }
  );

  t.deepEqual(
    Transaction.generateSimpleSchema(),
    {
      sourceAccountId: { type: String },
      targetAccountId: { type: String }
    }
  );
});

