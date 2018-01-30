// @flow

import Document from '../../src/Document';
import Model from '../../src/Model';
import type { HasManyRelation } from '../../src/Relations';
import createMockCollection from './createMockCollection';
import Account, { Accounts } from './Account';
import Transaction, { Transactions } from './Transaction';

export default class Company extends Document {
  accounts: HasManyRelation<Account, *> = this.hasMany('accounts', {
    collection() { return Accounts; },
    foreignKey: () => 'owner',
  });

  transactions: HasManyRelation<Transaction, Account> = this.hasMany('transactions', {
    collection() { return Transactions; },
    through() { return Accounts; },
  });
}

const mockCompanies = {
  tyrell: new Company({ name: 'Tyrell Corp.' }),
  yoyodyne: new Company({ name: 'Yoyodyne, Inc.' }),
};

export const Companies = createMockCollection('companies', mockCompanies);
