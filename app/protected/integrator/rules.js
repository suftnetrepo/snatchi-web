const projectValidator = {
  rules: {
    name: [
      { pattern: /^.+$/, message: 'Name is required' },
      { pattern: /^.{0,250}$/, message: 'Name must not exceed 250 characters' }
    ],
    project_number: [
      { pattern: /^.+$/, message: 'Project number is required' },
      { pattern: /^.{0,50}$/, message: 'Project number must not exceed 50 characters' }
    ],
    description: [
      { pattern: /^.+$/, message: 'Scope of Work is required' },
      { pattern: /^.{0,5000}$/, message: 'Scope of Work must not exceed 1000 characters' }
    ],
    status: [{ pattern: /^.+$/, message: 'Status is required' }],
    priority: [{ pattern: /^.+$/, message: 'Priority is required' }],
    startDate: [
      { pattern: /^.+$/, message: 'Start date is required' },
      {
        validate: (value, fields) => {
          if (fields?.endDate && new Date(value) > new Date(fields?.endDate)) {
            return 'Start date cannot be after end date';
          }
          return undefined;
        }
      }
    ],
    endDate: [
      { pattern: /^.+$/, message: 'End date is required' },
      {
        validate: (value, fields) => {
          if (fields.startDate && new Date(value) < new Date(fields.startDate)) {
            return 'End date cannot be before start date';
          }
          return undefined;
        }
      }
    ]
  },
  fields: {
    name: '',
    project_number: '',
    stakeholder: '',
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
    ppe: [],
    status: '',
    priority: '',
    description: null,
    startDate: '',
    endDate: '',
    addressLine1: '',
    county: '',
    town: '',
    country: '',
    postcode: '',
    completeAddress: '',
    location: {
      type: 'Point',
      coordinates: []
    }
  }
};

const taskValidator = {
  rules: {
    name: [
      { pattern: /^.+$/, message: 'Name is required' },
      { pattern: /^.{0,250}$/, message: 'Name must not exceed 250 characters' }
    ],
    description: [
      { pattern: /^.+$/, message: 'Scope of Work is required' },
      { pattern: /^.{0,5000}$/, message: 'Scope of Work must not exceed 1000 characters' }
    ],
    status: [{ pattern: /^.+$/, message: 'Status is required' }],
    priority: [{ pattern: /^.+$/, message: 'Priority is required' }],
    startDate: [
      { pattern: /^.+$/, message: 'Start date is required' },
      {
        validate: (value, fields) => {
          if (fields?.endDate && new Date(value) > new Date(fields?.endDate)) {
            return 'Start date cannot be after end date';
          }
          return undefined;
        }
      }
    ],
    endDate: [
      { pattern: /^.+$/, message: 'End date is required' },
      {
        validate: (value, fields) => {
          if (fields.startDate && new Date(value) < new Date(fields.startDate)) {
            return 'End date cannot be before start date';
          }
          return undefined;
        }
      }
    ]
  },
  fields: {
    name: '',
    status: '',
    priority: '',
    description: null,
    startDate: '',
    endDate: ''
  }
};

const fileValidator = {
  rules: {
    document_name: [
      { pattern: /^.+$/, message: 'Document name is required' },
      { pattern: /^.{0,250}$/, message: 'Document name must not exceed 100 characters' }
    ],
    document_type: [{ pattern: /^.+$/, message: 'Document Type is required' }]
  },
  fields: {
    document_name: '',
    document_type: '',
    file: '',
    fileName: ''
  }
};

const teamValidator = {
  rules: {
    id: [{ pattern: /^.+$/, message: 'Select user is required' }]
  },
  fields: {
    id: '',
    image: '',
    name: '',
    projectId: ''
  }
};

const userValidator = {
  rules: {
    first_name: [
      {
        pattern: /^.+$/,
        message: 'first name is required'
      },
      {
        pattern: /^.{0,50}$/,
        message: 'first name must not be more than 50 characters'
      }
    ],
    last_name: [
      { pattern: /^.+$/, message: 'last name is required' },
      {
        pattern: /^.{0,50}$/,
        message: 'last name must not be more than 50 characters'
      }
    ],
    email: [
      { pattern: /.+/, message: 'email address is required' },
      {
        pattern: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
        message: 'Please enter a valid email address'
      },
      {
        pattern: /^.{0,50}$/,
        message: 'email address must not be more than 50 characters'
      }
    ],
    mobile: [
      { pattern: /^.+$/, message: 'mobile is required' },
      {
        pattern: /^.{0,50}$/,
        message: 'mobile number must not be more than 20 characters'
      }
    ],
    role: [{ pattern: /^.+$/, message: 'role is required' }]
  },
  reset: () => {
    return {
      first_name: '',
      last_name: '',
      email: '',
      mobile: '',
      user_status: false,
      chat_status: false,
      role: '',
      visible: ''
    };
  },
  fields: {
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    user_status: false,
    chat_status: false,
    role: '',
    visible: ''
  }
};

const integratorValidator = {
  rules: {
    name: [
      { pattern: /^.+$/, message: 'Name is required' },
      { pattern: /^.{0,250}$/, message: 'Name must not exceed 100 characters' }
    ],
    email: [
      { pattern: /.+/, message: 'email address is required' },
      {
        pattern: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
        message: 'Please enter a valid email address'
      },
      {
        pattern: /^.{0,50}$/,
        message: 'email address must not be more than 50 characters'
      }
    ],
    mobile: [
      { pattern: /^.+$/, message: 'mobile is required' },
      {
        pattern: /^.{0,50}$/,
        message: 'mobile number must not be more than 20 characters'
      }
    ]
  },
  fields: {
    description: '',
    name: '',
    email: '',
    mobile: '',
    secure_url: '',
    public_id: '',
    status: '',
    startDate: '',
    endDate: '',
    password: '',
    confirm_password: ''
  }
};

const taskCommentValidator = {
  rules: {
    text: [
      { pattern: /^.+$/, message: 'Comment is required' },
      { pattern: /^.{0,250}$/, message: 'Comment must not exceed 250 characters' }
    ]
  },
  fields: {
    text: ''
  }
};

const schedulerValidator = {
  rules: {
    title: [
      { pattern: /^.+$/, message: 'Title is required' },
      { pattern: /^.{0,250}$/, message: 'Title must not exceed 100 characters' }
    ],
    status: [{ pattern: /^.+$/, message: 'Status is required' }],
    startDate: [
      { pattern: /^.+$/, message: 'Start date is required' },
      {
        validate: (value, fields) => {
          if (fields?.endDate && new Date(value) > new Date(fields?.endDate)) {
            return 'Start date cannot be after end date';
          }
          return undefined;
        }
      }
    ],
    endDate: [
      { pattern: /^.+$/, message: 'End date is required' },
      {
        validate: (value, fields) => {
          if (fields.startDate && new Date(value) < new Date(fields.startDate)) {
            return 'End date cannot be before start date';
          }
          return undefined;
        }
      }
    ]
  },
  fields: {
    description: '',
    status: 'Pending',
    startDate: '',
    endDate: '',
    title : ''
  }
};

export {
  taskCommentValidator,
  integratorValidator,
  taskValidator,
  projectValidator,
  fileValidator,
  userValidator,
  teamValidator,
  schedulerValidator
};
