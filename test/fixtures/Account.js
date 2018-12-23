// @flow

import { Document, Model } from '../../src';
import type { HasManyRelation, BelongsToRelation } from '../../src';
import type { MongoCompatibleCollection } from '../../src/MongoInterface';

import Company, { Companies } from './Company';
import Transaction, { Transactions } from './Transaction';
import createMockCollection from './createMockCollection';

export default class Account extends Document {
  owner: BelongsToRelation<Company, *> = this.belongsTo('owner', {
    collection: () => Companies,
  });

  ingoingTransactions: HasManyRelation<Transaction, *> = this.hasMany('ingoingTransactions', {
    collection() { return Transactions; },
    foreignKey: () => 'targetAccountId',
    options: () => ({ sort: { insertedAt: -1 } }),
  });

  outgoingTransactions: HasManyRelation<Transaction, *> = this.hasMany('outgoingTransactions', {
    collection() { return Transactions; },
    foreignKey: () => 'sourceAccountId',
    options: () => ({ sort: { insertedAt: -1 } }),
  });
}

const mockAccounts = {
  y1: new Account({
    ownerId: 'yoyodyne',
  }),
  y2: new Account({
    ownerId: 'yoyodyne',
  }),
  t1: new Account({
    ownerId: 'tyrell',
  }),
  t2: new Account({
    ownerId: 'tyrell',
  }),
};

export const Accounts = createMockCollection<Account>('accounts', mockAccounts);
