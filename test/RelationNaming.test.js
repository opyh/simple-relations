// @flow



import Account, { Accounts } from './fixtures/Account';
import Transaction, { Transactions } from './fixtures/Transaction';
import Company, { Companies } from './fixtures/Company';

const account = Accounts.findOne();
if (!account) throw new Error('Mock account must exist');

const owner = account.owner;
if (!owner) throw new Error('Mock account must have owner relation');


describe('Relation name variations', () => {
	test('name variations', async () => {
		expect(owner).toMatchObject({
			name: 'owner',
			humanName: 'Owner',
			humanNameSingular: 'Owner',
			humanNamePlural: 'Owners',
		})
		expect(owner.humanCollectionName()).toEqual('Companies');
		expect(owner.humanCollectionNameSingular()).toEqual('Company');
		expect(owner.foreignKey()).toEqual('ownerId');
	});
	
	it('warns when constructing a Document with a property named like a has-many relation', async () => {
		expect(() => {
			new Account({ ingoingTransactions: 'foo' });
		}).toThrowError('Cannot construct Document: ‘ingoingTransactions’ is no valid property. ‘ingoingTransactions’ is already a defined has-many relation.');
	});
	

	it('warns when constructing a Document with a property named like a belongs-to relation', async () => {
		expect(() => {
			new Account({ owner: '123' });
		}).toThrowError('Cannot construct Document: ‘owner’ is no valid property, as there is a belongs-to relation with the same name. Did you mean to use ‘ownerId’?');
	});
	
	// test.todo('supports a help text');
	
	// test.todo('collection definition');
})
