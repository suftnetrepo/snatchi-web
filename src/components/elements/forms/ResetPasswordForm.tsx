import { Fragment, MouseEvent, useState, FC } from 'react';
import Button from 'react-bootstrap/Button';
import { useRouter } from 'next/navigation';
import { passwordValidator } from '../../../../validator/loginValidator';
import { validate, Errors } from '../../../../validator/validator';
import { useSecure } from '../../../../hooks/useSecure';
import LoadingButton from '../button';
import { storage } from '../../../../utils/storage';

const ResetPasswordForm: FC = () => {
  const router = useRouter();
  const [validationError, setValidationError] = useState<Errors>({});
  const [fields, setFields] = useState(passwordValidator.fields);
  const [visiblePassword, setVisiblePassword] = useState(false);
  const { handleResetPassword, success, loading, error } = useSecure();

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const validationResult = validate(fields, passwordValidator.rules);

    if (validationResult.hasError) {
      setValidationError(validationResult.errors);
      return;
    }

    const store = storage.getItem("CODE")

    console.log(".....................................code")

    await handleResetPassword({ ...fields, email: store.email, code: store.code });
  };

  return (
    <Fragment>
      <p className="lead mb-3 text-start">
        {' '}
        You can use a combination of 8 or more characters, including a variety of letters, numbers, and symbols.
      </p>

      <form className="text-start mb-3">
        {error && (
          <div className="alert alert-danger alert-icon alert-dismissible fade show" role="alert">
            <i className="uil uil-times-circle" />
            {error}
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" />
          </div>
        )}
        {success && (
          <div className="alert alert-success alert-icon alert-dismissible fade show" role="alert">
            <i className="uil uil-times-circle" />
            Password change successful! You can log in with your new credentials.
          </div>
        )}        
        <div className="form-floating password-field mb-4">
          <input
            value={fields.password}
            id="loginPassword"
            placeholder="Password"
            className={`form-control ${validationError.password?.message ? 'is-invalid' : ''}`}
            type={visiblePassword ? 'text' : 'password'}
            onChange={(e) => setFields({ ...fields, password: e.target.value })}
          />
          <span className="password-toggle" onClick={() => setVisiblePassword(!visiblePassword)}>
            <i className={`uil  ${visiblePassword ? 'uil-eye-slash' : 'uil-eye'}`} />
          </span>
          <label htmlFor="password">Password</label>
          {validationError.password?.message && (
            <div id="validationServerUsernameFeedback" className="invalid-feedback">
              {validationError.password?.message}
            </div>
          )}
        </div>
        {success ? (
          <LoadingButton title="Login" loading={loading} onClick={() => router.push('/login')} />
        ) : (
          <div className="d-flex align-items-center justify-content-between">
            <div className="row w-100">
              <div className="col-md-9 col-lg-9 ">
                <LoadingButton disabled={success} title="Submit" loading={loading} onClick={handleSubmit} />
              </div>
              <div className="col-md-3 col-lg-3  mt-2 mt-md-0">
                <Button variant="outline-secondary" className="rounded-pill" onClick={() => router.back()}>
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Fragment>
  );
};

export default ResetPasswordForm;
