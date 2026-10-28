export const validClient = {
  firstName: 'Taylor',
  middleName: 'A',
  lastName: 'Sample',
  dateOfBirth: '1990-05-15',
  gender: 'FEMALE',
  maritalStatus: 'SINGLE',
  nationality: 'United States',
  occupation: 'Quality Analyst',
  employerName: 'Sample Company',
  employerAddress: '10 Sample Road',
  email: 'taylor.sample@example.test',
  mobile: '9876543210',
  address: '10 Sample Road',
  city: 'Austin',
  state: 'TX',
  postalCode: '78701',
};

export const invalidClientData = {
  underageDateOfBirth: '2015-05-15',
  futureDateOfBirth: '2099-01-01',
  email: 'not-an-email',
};
