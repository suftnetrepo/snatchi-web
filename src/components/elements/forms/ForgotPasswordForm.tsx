import { Fragment, MouseEvent, useState, FC } from 'react';
import Button from 'react-bootstrap/Button';
import { forgotValidator } from '../../../../validator/loginValidator';
import { validate, Errors } from '../../../../validator/validator';
import { useRouter } from 'next/navigation';
import { useSecure } from '../../../../hooks/useSecure';
import LoadingButton from '../button';

const ForgotPasswordForm: FC = () => {
  const router = useRouter();
  const [validationError, setValidationError] = useState<Errors>({});
  const [fields, setFields] = useState(forgotValidator.fields);
  const { handleForgotPassword, success, loading, error } = useSecure();

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const validationResult = validate(fields, forgotValidator.rules);

    if (validationResult.hasError) {
      setValidationError(validationResult.errors);
      return;
    }

    handleForgotPassword(fields).then((result) => {
      if (result) {
         router.push(`/verify?email=${encodeURIComponent(fields.email)}`);
      }
    });
  };

  return (
    <Fragment>
      <p className="lead mb-3 text-start">Forgot your password? Please enter your email address below to reset it.</p>

      <form className="text-start mb-3">
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
            className={`form-control ${validationError.email?.message ? 'is-invalid' : ''}`}
            onChange={(e) => setFields({ ...fields, email: e.target.value })}
          />
          <label htmlFor="email">Email</label>
          {validationError.email?.message && (
            <span id="validationServerUsernameFeedback" className="invalid-feedback">
              {validationError.email?.message}
            </span>
          )}
        </div>
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
      </form>
    </Fragment>
  );
};

export default ForgotPasswordForm;
