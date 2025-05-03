import { useState, useEffect } from 'react';
import NextLink from '@/components/reuseable/links/NextLink';
import Button from 'react-bootstrap/Button';
import { useRouter } from 'next/navigation';
import { signIn, getCsrfToken, getSession } from 'next-auth/react';
import { loginValidator } from '../../../../validator/loginValidator';
import { validate } from '../../../../validator/validator';
import { useSecure } from '../../../../hooks/useSecure';
import LoadingButton from '../button';
import { useUserChat } from '../../../../hooks/useUserChat';

const LoginForm = () => {
  const { handleChatSignIn, handleSignUp } = useUserChat();
  const [validationError, setValidationError] = useState({});
  const [fields, setFields] = useState({ email: '', password: '' });
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState("")
  const { handleError, error } = useSecure();
  const router = useRouter();

  useEffect(() => {
    getCsrfToken().then(setCsrfToken);
  }, []);

  const handleSubmit = async (e) => {
    setValidationError({});

    const validationResult = validate(fields, loginValidator.rules);
    if (validationResult.hasError) {
      setValidationError(validationResult.errors);
      return;
    }

    const result = await signIn('credentials', {
      redirect: false,
      email: fields.email,
      csrfToken,
      password: fields.password
    });

    if (!result?.ok) {
      handleError(result.error);
      return;
    }

    try {
      await handleChatSignIn(fields.email, '12345!');
    } catch (chatError) {
      console.error('Chat sign-in failed:', chatError);
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');

    const updatedSession = await getSession();
  
    let redirectPath;
    if (returnUrl) {
      redirectPath = returnUrl;
    } else {
      redirectPath = updatedSession?.user?.role === 'integrator' 
        ? '/protected/integrator/dashboard' 
        : '/protected/admin/dashboard';
    }
    
   router.push(redirectPath);
  };

  return (
    <div>
      <h2 className="mb-3 text-start">Welcome Back</h2>
      <p className="lead mb-3 text-start">Fill your email and password to sign in.</p>

      <form className="text-start mb-3" onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-danger alert-icon alert-dismissible fade show" role="alert">
            <i className="uil uil-times-circle" />
            {error}
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" />
          </div>
        )}

        <div className="form-floating mb-4">
          <input
            type="email"
            value={fields.email}
            id="email"
            placeholder="Email"
            className={`form-control ${validationError.email ? 'is-invalid' : ''}`}
            onChange={(e) => setFields({ ...fields, email: e.target.value })}
          />
          <label htmlFor="email">Email</label>
          {validationError.email && <div className="invalid-feedback">{validationError.email.message}</div>}
        </div>

        <div className="form-floating password-field mb-4">
          <input
            value={fields.password}
            id="loginPassword"
            placeholder="Password"
            className={`form-control ${validationError.password ? 'is-invalid' : ''}`}
            type={visiblePassword ? 'text' : 'password'}
            onChange={(e) => setFields({ ...fields, password: e.target.value })}
          />
          <span
            className="password-toggle"
            onClick={() => setVisiblePassword(!visiblePassword)}
            aria-label={visiblePassword ? 'Hide password' : 'Show password'}
          >
            <i className={`uil ${visiblePassword ? 'uil-eye-slash' : 'uil-eye'}`} />
          </span>
          <label htmlFor="password">Password</label>
          {validationError.password && <div className="invalid-feedback">{validationError.password.message}</div>}
        </div>

        <div className="d-flex align-items-center justify-content-between">
          <div className="row w-100">
            <div className="col-md-9 col-lg-9">
              <LoadingButton  type="button" onClick={() => handleSubmit()}>
                Sign In
              </LoadingButton>
            </div>
            <div className="col-md-3 col-lg-3 mt-2 mt-md-0">
              <Button variant="outline-secondary" className="rounded-pill" onClick={() => router.push('/')}>
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </form>

      <p className="mb-1">
        <NextLink title="Forgot Password?" href="/forgotPassword" className="hover" />
      </p>
    </div>
  );
};

export default LoginForm;
