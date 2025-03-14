const checkoutValidator = {
  rules: {
    name: [
      {
        pattern: /^.+$/,
        message: 'company is required'
      }
    ],
    first_name: [
      {
        pattern: /^.+$/,
        message: 'first name is required'
      },
      {
        pattern: /^.{0,50}$/,
        message: 'first name must be 50 characters'
      }
    ],
    last_name: [
      { pattern: /^.+$/, message: 'last name is required' },
      {
        pattern: /^.{0,50}$/,
        message: 'last name must be 50 characters'
      }
    ],
    mobile: [
      {
        pattern: /^.+$/,
        message: 'mobile is required'
      }
    ],
    email: [
      { pattern: /.+/, message: 'email address is required' },
      {
        pattern: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
        message: 'Please enter a valid email address',
      },
      {
        pattern: /^.{0,50}$/,
        message: 'email address must be no more than 50 characters',
      },
    ],
  },
  fields: {
    first_name: '',
    last_name: '',
    name:'',
    email:'',
    mobile :'',
    priceId:'',
    stripeCustomerId: '',
    subscriptionId: '',
    terms : false
  }
}

export { checkoutValidator }
