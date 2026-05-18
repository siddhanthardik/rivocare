const { autoAssignDepartment } = require('../src/constants/departments');

const mockReq = {
  body: {
    testName: 'CBC complete blood count',
    price: 500,
    mrp: 1000
  },
  partner: { id: '69f8cf7eb4624cb661c2bc0a' }
};

function simulateAdd() {
  let data = { ...mockReq.body };
  if (data.testName && !data.name) data.name = data.testName;
  if (!data.department) {
    data.department = autoAssignDepartment(data.testName || data.name);
  }
  console.log('Resulting data:', data);
}

simulateAdd();
