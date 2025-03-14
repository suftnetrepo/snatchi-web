const loginValidator = {
  rules: {
    password: [
      {
        pattern: /^.+$/,
        message: 'password is required'
      },
      {
        pattern: /^.{0,20}$/,
        message: 'password must be no more than 20 characters'
      }
    ],
    email: [
      {
        pattern: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
        message: 'Please enter a valid email address'
      }
    ]
  },
  fields: {
    email: '',
    password : ''
  }
}

const forgotValidator = {
  rules: {    
    email: [
      {
        pattern: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
        message: 'Please enter a valid email address'
      }
    ]
  },
  fields: {
    email: ''   
  }
}

const verifyCodeValidator = {
  rules: {
    email: [
      {
        pattern: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
        message: 'Please enter a valid email address'
      }
    ],
    code: [
      {
        pattern: /^.+$/,
        message: 'code is required'
      },
      {
        pattern: /^.{0,50}$/,
        message: 'code must not be more than 8 characters'
      }
    ]
  },
  fields: {
    email: '',
    code : ''
  }
}

const passwordValidator = {
  rules: {
    password: [
      {
        pattern: /^.+$/,
        message: 'password is required'
      },
      {
        pattern: /^.{0,20}$/,
        message: 'password must be no more than 20 characters'
      }
    ],
  },
  fields: {
    password: ''
  }
}

export { forgotValidator, loginValidator, passwordValidator, verifyCodeValidator }
