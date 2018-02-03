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
    options: () => ({ sort: { insertedAt: -1 } }),
  });

  outgoingTransactions: HasManyRelation<Transaction, *> = this.hasMany('outgoingTransactions', {
    collection() { return Transactions; },
    foreignKey: () => 'sourceAccountId',
    options: () => ({ sort: { insertedAt: -1 } }),
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

Accounts = new Meteor.Collection('Accounts', { transform: d => new Account(d) });
Transactions = new Meteor.Collection('Transactions', { transform: d => new Transaction(d) });

['a', 'b'].forEach(_id => Accounts.insert({ _id });
Transactions.insert({ sourceAccountId: 'a', targetAccountId: 'b' });

const transactions = Accounts.findOne('a').ingoingTransactions.find().fetch();
const account = transactions[0].sourceAccount.findOne();

const AccountRelationSchema = Account.generateSimpleSchema()
```
