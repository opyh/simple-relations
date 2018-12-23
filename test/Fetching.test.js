// @flow

import Account, { Accounts } from './fixtures/Account';
import Transaction, { Transactions } from './fixtures/Transaction';
import Company, { Companies } from './fixtures/Company';

const yoyodynesFirstAccount: ?Account = Accounts.findOne('y1');
const tyrell: ?Company = Companies.findOne('tyrell');
const yoyodyne: ?Company = Companies.findOne('yoyodyne');

if (!yoyodynesFirstAccount) throw new Error('Mock account must exist');
if (!tyrell) throw new Error('Mock company `tyrell` must exist');
if (!yoyodyne) throw new Error('Mock company `yoyodyne` must exist');

describe('Fetching', async () => {
  it('finds a belongs-to related document', async () => {
    if (!yoyodynesFirstAccount) throw new Error('Mock account must be defined');
    const owner = yoyodynesFirstAccount.owner.findOne();
    if (!owner) throw new Error('Owner must be defined');
    expect(owner).toBeInstanceOf(Company);
    expect(owner.get('name')).toBe('Yoyodyne, Inc.');
  });


  it('finds has-many related documents', async () => {
    if (!tyrell) throw new Error('Mock company must be defined');
    const accounts = tyrell.accounts;
    const cursor = accounts.find();
    const accountDocs = cursor.fetch();
    expect(accountDocs.length).toEqual(2);
    const ownerNames = accountDocs
      .map(account => account.owner.findOne())
      .filter(Boolean)
      .map(account => account.get('name'));
    expect(ownerNames).toEqual(['Tyrell Corp.', 'Tyrell Corp.']);
    const ids = accountDocs.map(account => account._id);
    expect(ids).toEqual(['t1', 't2']);
  });
  
  
  it('finds has-many related documents with automatic foreign key', async () => {
  const tyrellShareholders = tyrell.shareholders.find().fetch();
    expect(tyrellShareholders).toHaveLength(2);
    expect(tyrellShareholders[0].get('name')).toBe('Alice');
    expect(tyrellShareholders[1].get('name')).toBe('Bob');
  
    const yoyodyneShareholders = yoyodyne.shareholders.find().fetch();
    expect(yoyodyneShareholders).toHaveLength(0);
  });
  
  it('finds has-many related documents with custom foreign key', async () => {
    const ingoingTransactions = yoyodynesFirstAccount.ingoingTransactions.find().fetch();
    expect(ingoingTransactions).toHaveLength(1);
    expect(ingoingTransactions[0]).toHaveProperty('_id', 'fromTyrellToYoyodyne1');
  });
  
  
  it('finds has-many-through related documents', async () => {
    const ingoingTransactions = tyrell.ingoingTransactions.find().fetch();
    expect(ingoingTransactions).toHaveLength(2);
    expect(ingoingTransactions).toMatchObject([{_id: 'fromYoyodyneToTyrell1'}, {_id: 'fromYoyodyneToTyrell2'}]);
  
    const outgoingTransactions = tyrell.outgoingTransactions.find().fetch();
    expect(outgoingTransactions).toHaveLength(2);
    expect(outgoingTransactions).toMatchObject([{_id: 'fromTyrellToYoyodyne1'}, {_id: 'fromTyrellToYoyodyne2'}]);
  });
})
