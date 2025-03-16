import React, { useState } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { ACCOUNT } from '../utils/apiUrl';
import { forgotValidator } from '../validator/loginValidator';

interface Initialize {
  data: {} | [] | null;
  loading: boolean;
  error: null | string;
  fields: {};
  success: boolean;
}

const useSecure = () => {
  const [state, setState] = useState<Initialize>({
    data: null,
    loading: false,
    error: null,
    fields: forgotValidator.fields,
    success: false
  });

  const handleError = (error: string) => {
    setState((pre) => {
      return { ...pre, error: error, loading: false };
    });
  };

  const handleChange = (name: string, value: string) => {
    setState((prevState) => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [name]: value
      }
    }));
  };

  const handleLogin = async (fields: any) => {
    setState((pre) => {
      return { ...pre, error: null, loading: false };
    });
    const { data, success, errorMessage, status } = await zat(ACCOUNT.login, fields, VERBS.POST);

    if (success) {
      setState((pre) => {
        return { ...pre, data: data, loading: false };
      });
      return { success, user: data, status };
    } else {
      handleError(errorMessage);
    }
  };

  const handleForgotPassword = async (fields: any) => {
    setState((pre) => {
      return { ...pre, error: null, loading: false };
    });
    const { data, success, errorMessage } = await zat(ACCOUNT.forgot, fields, VERBS.POST);

    if (success) {
      setState((pre) => {
        return { ...pre, success: data, loading: false };
      });
      return { success, user: data };
    } else {
      handleError(errorMessage);
    }
  };

   const handleVerifyCode = async (fields: any) => {
     setState((pre) => {
       return { ...pre, error: null, loading: false };
     });
     const { data, success, errorMessage } = await zat(ACCOUNT.verify, fields, VERBS.POST);

     if (success) {       
       return data;
     } else {
       handleError(errorMessage);
     }
   };

  const handleResetPassword = async (fields: any) => {
    setState((pre) => {
      return { ...pre, error: null, loading: false };
    });
    const { data, success, errorMessage } = await zat(ACCOUNT.reset, fields, VERBS.POST);

    if (success) {
      setState((pre) => {
        return { ...pre, success: data, loading: false };
      });
      return { success, user: data };
    } else {
      handleError(errorMessage);
    }
  };

  // const handleLogout = async () => {
  //   const { success, errorMessage } = await zat(ACCOUNT.logout, null, VERBS.POST);

  //   if (success) {
  //     setState((pre) => {
  //       return { ...pre, data: success, loading: false };
  //     });
  //     return success;
  //   } else {
  //     handleError(errorMessage);
  //   }
  // };

  return {
    ...state,
    handleLogin,
    // handleLogout,
    handleChange,
    handleForgotPassword,
    handleResetPassword,
    handleVerifyCode,
    handleError
  };
};

export { useSecure };
