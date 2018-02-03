// @flow

import test from 'ava';

import { Companies } from './fixtures/Company';
import { Accounts } from './fixtures/Account';

const account = Accounts.findOne();


test('Mock collection finds a document by ID', t => {
  const company = Companies.findOne('yoyodyne');
  if (!company) throw new Error('Mock company must exist');
  t.is(typeof company, 'object');
  t.is(company.get('name'), 'Yoyodyne, Inc.');
});


test('Mock collection finds a document by object selector', t => {
  const company = Companies.findOne({ _id: 'yoyodyne' });
  if (!company) throw new Error('Mock company must exist');
  t.is(typeof company, 'object');
  t.is(company.get('name'), 'Yoyodyne, Inc.');
});


test('Mock collection find() returns a cursor of all documents', t => {
  const companies = Companies.find();
  t.is(typeof companies, 'object');
  t.is(companies.fetch().length, 2);
});
