// @flow

import Document from '../../src/Document';
import Model from '../../src/Model';
import type { BelongsToRelation } from '../../src/Relations';
import Account, { Accounts } from './Account';
import createMockCollection from './createMockCollection';

export default class Transaction extends Document {
  sourceAccount: BelongsToRelation<Account, *> = this.belongsTo('sourceAccount', {
    collection: () => Accounts,
  });

  targetAccount: BelongsToRelation<Account, *> = this.belongsTo('targetAccount', {
    collection: () => Accounts,
  });
}


const mockTransactions = {
  fromAToB: new Transaction({ sourceAccountId: 'a', targetAccountId: 'b' }),
  fromBToA: new Transaction({ sourceAccountId: 'b', targetAccountId: 'a' }),
};

export const Transactions = createMockCollection('transactions', mockTransactions);
