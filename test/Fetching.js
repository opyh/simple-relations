// @flow

import test from 'ava';

import Account, { Accounts } from './fixtures/Account';
import Transaction, { Transactions } from './fixtures/Transaction';
import Company, { Companies } from './fixtures/Company';

const yoyodynesFirstAccount: ?Account = Accounts.findOne('y1');
const tyrell: ?Company = Companies.findOne('tyrell');

if (!yoyodynesFirstAccount) throw new Error('Mock account must exist');
if (!tyrell) throw new Error('Mock company must exist');

test('Finds a belongs-to related document', t => {
  if (!yoyodynesFirstAccount) throw new Error('Mock account must be defined');
  const owner = yoyodynesFirstAccount.owner.findOne();
  if (!owner) throw new Error('Owner must be defined');
  t.is(typeof owner, 'object');
  t.is(owner.get('name'), 'Yoyodyne, Inc.');
});

test('Finds has-many related documents', t => {
  if (!tyrell) throw new Error('Mock company must be defined');
  const accounts = tyrell.accounts;
  t.is(typeof accounts, 'object');
  const cursor = accounts.find();
  t.is(typeof cursor, 'object');
  const accountDocs = cursor.fetch();
  t.is(accountDocs.length, 2);
  const ownerNames = accountDocs
    .map(account => account.owner.findOne())
    .filter(Boolean)
    .map(account => account.get('name'));
  t.deepEqual(ownerNames, ['Tyrell Corp.', 'Tyrell Corp.']);
  const ids = accountDocs.map(account => account._id);
  t.deepEqual(ids, ['t1', 't2']);
});

test('Finds has-many related documents with custom foreign key', t => {
  const ingoingTransactions = yoyodynesFirstAccount.ingoingTransactions.find().fetch();
  t.is(ingoingTransactions.length, 1);
  t.is(ingoingTransactions[0]._id, 'fromTyrellToYoyodyne1');
});

test('Finds has-many-through related documents', t => {
  const ingoingTransactions = tyrell.ingoingTransactions.find().fetch();
  t.is(ingoingTransactions.length, 2);
  t.deepEqual(
    ingoingTransactions.map(t => t._id),
    ['fromYoyodyneToTyrell1', 'fromYoyodyneToTyrell2']
  );

  const outgoingTransactions = tyrell.outgoingTransactions.find().fetch();
  t.is(outgoingTransactions.length, 2);
  t.deepEqual(
    outgoingTransactions.map(t => t._id),
    ['fromTyrellToYoyodyne1', 'fromTyrellToYoyodyne2']
  );
});
