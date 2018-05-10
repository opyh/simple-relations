// @flow

import Document from '../../src/Document';
import Model from '../../src/Model';
import type { HasManyRelation, BelongsToRelation } from '../../src/Relations';
import createMockCollection from './createMockCollection';
import Company, { Companies } from './Company';

export default class Shareholder extends Document {
  company: BelongsToRelation<Company, *> = this.belongsTo('company', {
    collection: () => Companies,
  });
}

const mockShareholders = {
  alice: new Shareholder({ name: 'Alice', companyId: 'tyrell' }),
  bob: new Shareholder({ name: 'Bob', companyId: 'tyrell' }),
};

export const Shareholders = createMockCollection('shareholders', mockShareholders);