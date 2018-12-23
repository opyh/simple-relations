// @flow



import Company, { Companies } from './fixtures/Company';
import { Accounts } from './fixtures/Account';

const account = Accounts.findOne();


describe('Mock collection find()/findOne()', () => {
  it('finds a document by ID', async () => {
    const company = Companies.findOne('yoyodyne');
    if (!company) throw new Error('Mock company must exist');
    expect(company).toBeInstanceOf(Company);
    expect(company.get('name')).toEqual('Yoyodyne, Inc.');
  });

  
  it('finds a document by object selector', async () => {
    const company = Companies.findOne({ _id: 'yoyodyne' });
    if (!company) throw new Error('Mock company must exist');
    expect(company).toBeInstanceOf(Company);
    expect(company.get('name')).toEqual('Yoyodyne, Inc.');
  });
  
  
  it('returns returns a cursor of all documents', async () => {
    const companies = Companies.find();
    companies.forEach(company => expect(company).toBeInstanceOf(Company));
    expect(companies.count()).toBe(2);
  });
})
