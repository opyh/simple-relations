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
  fromTyrellToYoyodyne1: new Transaction({ sourceAccountId: 't1', targetAccountId: 'y1' }),
  fromTyrellToYoyodyne2: new Transaction({ sourceAccountId: 't2', targetAccountId: 'y2' }),
  fromYoyodyneToTyrell1: new Transaction({ sourceAccountId: 'y1', targetAccountId: 't1' }),
  fromYoyodyneToTyrell2: new Transaction({ sourceAccountId: 'y2', targetAccountId: 't2' }),
};

export const Transactions = createMockCollection('transactions', mockTransactions);
