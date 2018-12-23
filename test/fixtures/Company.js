// @flow

import Document from '../../src/Document';
import Model from '../../src/Model';
import type { HasManyRelation } from '../../src/Relations';
import createMockCollection from './createMockCollection';
import Account, { Accounts } from './Account';
import Transaction, { Transactions } from './Transaction';
import Shareholder, { Shareholders } from './Shareholder';

export default class Company extends Document {
  accounts: HasManyRelation<Account, *> = this.hasMany('accounts', {
    collection() { return Accounts; },
    foreignKey: () => 'owner',
  });

  shareholders: HasManyRelation<Shareholder, *> = this.hasMany('shareholders', {
    collection() { return Shareholders; },
  });

  ingoingTransactions: HasManyRelation<Transaction, Account> = this.hasMany('incomingTransactions', {
    collection() { return Transactions; },
    through() { return Accounts; },
    throughForeignKey: () => 'owner',
    foreignKey: () => 'targetAccountId',
  });

  outgoingTransactions: HasManyRelation<Transaction, Account> = this.hasMany('outgoingTransactions', {
    collection() { return Transactions; },
    through() { return Accounts; },
    throughForeignKey: () => 'owner',
    foreignKey: () => 'sourceAccountId',
  });
}

const mockCompanies = {
  tyrell: new Company({ name: 'Tyrell Corp.' }),
  yoyodyne: new Company({ name: 'Yoyodyne, Inc.' }),
};

export const Companies = createMockCollection('companies', mockCompanies);

Company.collection = () => Companies;
