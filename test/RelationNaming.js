// @flow

import test from 'ava';

import Account, { Accounts } from './fixtures/Account';
import Transaction, { Transactions } from './fixtures/Transaction';
import Company, { Companies } from './fixtures/Company';

const account = Accounts.findOne();

test('name', t => {
	t.is(account.owner.name, 'owner');
});

test('human readable name', t => {
	t.is(account.owner.humanName, 'Owner');
});

test('human readable singular name', t => {
	t.is(account.owner.humanNameSingular, 'Owner');
});

test('human readable plural name', t => {
	t.is(account.owner.humanNamePlural, 'Owners');
});

test('human readable collection name', t => {
	t.is(account.owner.humanCollectionName(), 'Companies');
});

test('human readable collection name in singular', t => {
	t.is(account.owner.humanCollectionNameSingular(), 'Company');
});

test.todo('supports a help text');

test.todo('collection definition');
