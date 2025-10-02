import { HOST } from '../config';

export const ACCOUNT = {
  login: `${HOST}auth/login`,
  logout: `${HOST}auth/logout`,
  forgot: `${HOST}auth/forgot`,
  verify: `${HOST}auth/verify`,
  reset: `${HOST}auth/reset`
};

export const SCHEDULER = {
  createOne: `${HOST}scheduler`,
  updateOne: `${HOST}scheduler`,
  updatestatus: `${HOST}scheduler`,
  removeOne: `${HOST}scheduler/`,
  getAll: `${HOST}scheduler/`,
  getByUser: `${HOST}user?action=getByUser`,
  getByDates: `${HOST}user?action=getByDates`
};

export const USER = {
  createOne: `${HOST}user`,
  updateOne: `${HOST}user`,
  changePassword: `${HOST}user`,
  fetch: `${HOST}user/`,
  removeOne: `${HOST}user/`,
  getById: `${HOST}user/`,
  aggregate: `${HOST}user?action=aggregate`,
  search: `${HOST}user/`
};

export const INVOICE = {
  createOne: `${HOST}invoice`,
  updateOne: `${HOST}invoice`,
  removeOne: `${HOST}invoice/`,
  fetchMyInvoices: `${HOST}invoice?action=myInvoices`,
  fetchInvoices: `${HOST}invoice`,
  aggregate: `${HOST}invoice?action=aggregate`,
  searchInvoices: `${HOST}invoice?action=searchInvoices`
};

export const TASK_COMMENTS = {
  addOne: `${HOST}task_comment`,
  fetch: `${HOST}task_comment/`,
  removeOne: `${HOST}task_comment/`
};

export const INTEGRATOR = {
  fetchIntegrators: `${HOST}admin`,
  searchIntegrators: `${HOST}integrator`,
  fetchSingle: `${HOST}integrator/fetchSingle`,
  uploadOne: `${HOST}integrator/updateOne`
};

export const SUBSCRIBER = {
  createIntegrator: `${HOST}subscriber`
};

export const DASHBOARD = {
  paginate: `${HOST}admin?action=paginate`,
  aggregate: `${HOST}admin?action=aggregate`,
  recent: `${HOST}admin?action=recent`,
  chart: `${HOST}admin?action=chart`
};

export const STRIPE = {
  createCustomer: `${HOST}stripe/customer`,
  createSubscriber: `${HOST}stripe/subscriber`,
  createCustomerPortalSession: `${HOST}stripe/customerPortal`
};

export const PROJECT = {
  createOne: `${HOST}project`,
  updateOne: `${HOST}project`,
  fetchOne: `${HOST}project/`,
  fetch: `${HOST}project/`,
  removeOne: `${HOST}project/`,
  paginate: `${HOST}project?action=paginate`,
  aggregate: `${HOST}project?action=aggregate`,
  recent: `${HOST}project?action=recent`,
  chart: `${HOST}project?action=chart`
};

export const PUSH_NOTIFICATION = {
  notify: `${HOST}notify`
};

export const DOCUMENT = {
  uploadOne: `${HOST}project_document`,
  fetch: `${HOST}project_document/`,
  removeOne: `${HOST}project_document/`
};

export const TASK_DOCUMENT = {
  uploadOne: `${HOST}task_document`,
  fetch: `${HOST}task_document/`,
  removeOne: `${HOST}task_document/`
};

export const TASK_TEAM = {
  addOne: `${HOST}task_team`,
  fetch: `${HOST}task_team/`,
  removeOne: `${HOST}task_team/`
};

export const TEAM = {
  addOne: `${HOST}project_team`,
  fetch: `${HOST}project_team/`,
  removeOne: `${HOST}project_team/`
};

export const TASK = {
  createOne: `${HOST}task`,
  updateOne: `${HOST}task`,
  fetchOne: `${HOST}task/`,
  fetch: `${HOST}task/`,
  removeOne: `${HOST}task/`
};

export const USER_DOCUMENTS = {
  addOne: `${HOST}user/document`,
  fetch: `${HOST}user/document`,
  removeOne: `${HOST}user/document/`
};

export const FENCE = {
  addOne: `${HOST}fence`,
  fetch: `${HOST}fence`,
  removeOne: `${HOST}fence/`
};
