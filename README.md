# simple-relations

- Adds relational data accessors to documents in Meteor, inspired by Ruby on Rails’ `ActiveRecord`
- Supports has-many, belongs-to and has-many-through relations
- Creates `SimpleSchema` definitions to validate data
- Uses FlowType

## Installation

```bash
npm install --save simple-relations
```

## Usage example

```javascript
import { Meteor } from 'meteor/meteor';
import { Document, Model } from 'simple-relations';
import type { HasManyRelation, BelongsToRelation } from 'simple-relations';

let Accounts;
let Transactions;


class Account extends Document {
  ingoingTransactions: HasManyRelation<Transaction, *> = this.hasMany('ingoingTransactions', {
    collection() { return Transactions; },
    foreignKey: () => 'targetAccountId',
    options: () => ({ sort: { insertedAt: -1 } }), // default options for generated cursors
  });

  outgoingTransactions: HasManyRelation<Transaction, *> = this.hasMany('outgoingTransactions', {
    collection() { return Transactions; },
    foreignKey: () => 'sourceAccountId',
    options: () => ({ sort: { insertedAt: -1 } }),  // default options for generated cursors
    allowedIds: () => ['a', 'b'] // Limits assignable IDs in generated SimpleSchema
  });
}


export default class Transaction extends Document {
  sourceAccount: BelongsToRelation<Account, *> = this.belongsTo('sourceAccount', {
    collection: () => Accounts,
  });

  targetAccount: BelongsToRelation<Account, *> = this.belongsTo('targetAccount', {
    collection: () => Accounts,
  });
}

const Accounts = new Meteor.Collection('Accounts', { transform: d => new Account(d) });
const Transactions = new Meteor.Collection('Transactions', { transform: d => new Transaction(d) });

// Generate some test data and insert it into the database
['a', 'b'].forEach(_id => Accounts.insert({ _id });
Transactions.insert({ sourceAccountId: 'a', targetAccountId: 'b' });
Transactions.insert({ sourceAccountId: 'b', targetAccountId: 'a' });

// Use accessors to fetch related data from the database
const transactions = Accounts.findOne('a').ingoingTransactions.find().fetch();
const account = transactions[0].sourceAccount.findOne();

// Creates a SimpleSchema definition object
const TransactionSchema = Transaction.generateSimpleSchema();
```
