// @flow

import test from 'ava';

import Account, { Accounts } from './fixtures/Account';
import Transaction, { Transactions } from './fixtures/Transaction';
import Company, { Companies } from './fixtures/Company';

const yoyodynesFirstAccount = Accounts.findOne('y1');
const tyrell = Companies.findOne('tyrell');

test('Finds a belongs-to related document', t => {
  const owner = yoyodynesFirstAccount.owner.findOne();
  t.is(typeof owner, 'object');
  t.is(owner.name, 'Yoyodyne, Inc.');
});

test('Finds has-many related documents', t => {
  const accounts = tyrell.accounts;
  t.is(typeof accounts, 'object');
  const cursor = accounts.find();
  t.is(typeof cursor, 'object');
  const accountDocs = cursor.fetch();
  t.is(accountDocs.length, 2);
  const ownerNames = accountDocs.map(account => account.owner.findOne().name);
  t.deepEqual(ownerNames, ['Tyrell Corp.', 'Tyrell Corp.']);
  const ids = accountDocs.map(account => account._id);
  t.deepEqual(ids, ['t1', 't2']);
});

test('Finds has-many related documents with custom foreign key', t => {

});

test('Finds has-many-through related documents', t => {

});

test('Finds has-many-through related documents', t => {

});