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

test('warns when constructing a Document with a property named like a has-many relation', t => {
	const error = t.throws(() => {
		new Account({ ingoingTransactions: 'foo' });
	}, Error);

	t.is(error.message, 'Cannot construct Document: ‘ingoingTransactions’ is no valid property. ‘ingoingTransactions’ is already a defined has-many relation.');
});

test('warns when constructing a Document with a property named like a belongs-to relation', t => {
	const error = t.throws(() => {
		new Account({ owner: '123' });
	}, Error);

	t.is(error.message, 'Cannot construct Document: ‘owner’ is no valid property, as there is a belongs-to relation with the same name. Did you mean to use ‘ownerId’?');
});

test.todo('supports a help text');

test.todo('collection definition');
