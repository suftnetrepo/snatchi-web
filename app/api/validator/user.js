import Validator from 'fastest-validator';

function loginValidator(data) {
  const validator = new Validator();
  const schema = {
    email: { type: 'email' }
  };
  return validator.validate(data, schema);
}

function signOnValidator(data) {
  const validator = new Validator();
  const schema = {
    email: { type: 'email' },
    password: { type: 'string', min: 6 }
  };
  return validator.validate(data, schema);
}

function passwordValidator(data) {
  const validator = new Validator();
  const schema = {
    password: { type: 'string', min: 6 }
  };
  return validator.validate(data, schema);
}

function userValidator(data) {
  const validator = new Validator();
  const schema = {
    email: { type: 'email', empty: false, max: 50 },
    first_name: { type: 'string', empty: false, max: 50 },
    last_name: { type: 'string', empty: false, max: 50 },
    mobile: { type: 'string', empty: false, max: 50 }
  };
  return validator.validate(data, schema);
}

function userEditValidator(data) {
  const validator = new Validator();
  const schema = {
    first_name: { type: 'string', empty: false, max: 50 },
    last_name: { type: 'string', empty: false, max: 50 },
    mobile: { type: 'string', empty: false, max: 50 }
  };
  return validator.validate(data, schema);
}

function userStatusValidator(data) {
  const validator = new Validator();
  const schema = {
    status: { type: 'string', empty: false, max: 50 },
    data: { type: 'string', empty: false, max: 20 }
  };
  return validator.validate(data, schema);
}

function schedulerValidator(data) {
  const validator = new Validator();
  const schema = {
    status: { type: 'string', empty: false, max: 50 },
    startDate: { type: 'string', empty: false, max: 50 },
    endDate: { type: 'string', empty: false, max: 50 },
    title: { type: 'string', empty: false, max: 100 },
    price_offer: { type: 'number', min: 0, optional: true, convert: true },
    service_rate: { type: 'string', empty: false, optional: true }
  };
  return validator.validate(data, schema);
}

function documentValidator(data) {
  const validator = new Validator();
  const schema = {
    name: { type: 'string', empty: false, max: 50 }
  };
  return validator.validate(data, schema);
}

function teamValidator(data) {
  const validator = new Validator();
  const schema = {
    name: { type: 'string', empty: false, max: 100 }
  };
  return validator.validate(data, schema);
}

function projectValidator(data) {
  const validator = new Validator();
  const schema = {
    name: { type: 'string', empty: false, max: 250 },
    project_number: { type: 'string', empty: false, max: 50 },
    status: { type: 'enum', values: ['Pending', 'Progress', 'Completed', 'Canceled'] },
    priority: { type: 'enum', values: ['Low', 'Medium', 'High'] },
    description: { type: 'string', empty: false, max: 5000 },
    startDate: { type: 'date', convert: true },
    endDate: { type: 'date', convert: true },
    email: { type: 'email', empty: true, max: 254, optional: true },
    first_name: { type: 'string', max: 100, optional: true },
    last_name: { type: 'string', max: 100, optional: true },
    mobile: { type: 'string', max: 50, optional: true },
    completeAddress: { type: 'string', max: 255, optional: true }
  };
  const result = validator.validate(data, schema);
  if (result !== true) return result;

  if (new Date(data.startDate) > new Date(data.endDate)) {
    return [{ field: 'endDate', message: 'End date cannot be before start date' }];
  }

  return true;
}

function integratorValidator(data) {
  const validator = new Validator();
  const schema = {
    email: { type: 'email', empty: false, max: 50 },
    name: { type: 'string', empty: false, max: 50 },
    // Stripe identifiers are assigned after the local pending account exists.
    subscriptionId: { type: 'string', empty: false, optional: true },
    priceId: { type: 'string', empty: false },
    stripeCustomerId: { type: 'string', empty: false, optional: true },
    mobile: { type: 'string', empty: false, max: 50 }
  };
  return validator.validate(data, schema);
}

function integratorUpdateValidator(data) {
  const validator = new Validator();
  const schema = {
    email: { type: 'email', empty: false, max: 50 },
    name: { type: 'string', empty: false, max: 50 },
    mobile: { type: 'string', empty: false, max: 50 }
  };
  return validator.validate(data, schema);
}

function codeValidator(data) {
  const validator = new Validator();
  const schema = {
    email: { type: 'email' },
    code: { type: 'string', min: 6, max: 6 }
  };
  return validator.validate(data, schema);
}

function fenceValidator(data) {
  const v = new Validator();
  const schema = {
    integrator: { type: 'string', empty: false },
    user: { type: 'string', empty: false },
    project: { type: 'string', empty: false },

    date: { type: 'date', convert: true, optional: true },
    time: { type: 'string', optional: true },

    status: { type: 'enum', values: ['Enter', 'Exit'], empty: false },

    completeAddress: { type: 'string', max: 255, optional: true }
  };

  return v.validate(data, schema);
}

function engineerServiceRateValidator(data) {
  const validator = new Validator();
  const schema = {
    serviceName: { type: 'string', empty: false, max: 100 },
    rate: { type: 'number', empty: false, min: 0 },
    rateType: { type: 'enum', values: ['hourly', 'daily', 'fixed'], optional: true },
    description: { type: 'string', empty: true, max: 500, optional: true }
  };
  return validator.validate(data, schema);
}

export {
  userEditValidator,
  integratorUpdateValidator,
  projectValidator,
  teamValidator,
  documentValidator,
  integratorValidator,
  passwordValidator,
  signOnValidator,
  loginValidator,
  userValidator,
  codeValidator,
  fenceValidator,
  userStatusValidator,
  schedulerValidator,
  engineerServiceRateValidator
};
