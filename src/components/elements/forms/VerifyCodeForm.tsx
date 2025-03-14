import { Fragment, MouseEvent, useState, FC } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from 'react-bootstrap/Button';
import { verifyCodeValidator } from '../../../../validator/loginValidator';
import { validate, Errors } from '../../../../validator/validator';
import { useSecure } from '../../../../hooks/useSecure';
import LoadingButton from '../button';
import { storage } from './../../../../utils/storage';

const VerifyCodeForm: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [validationError, setValidationError] = useState<Errors>({});
  const [fields, setFields] = useState(verifyCodeValidator.fields);
  const { handleVerifyCode, success, loading, error } = useSecure();

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const validationResult = validate({ ...fields, email }, verifyCodeValidator.rules);

    if (validationResult.hasError) {
      setValidationError(validationResult.errors);
      return;
    }

    handleVerifyCode({ ...fields, email }).then((result) => {
      if (result) {
        storage.setItem('CODE', { ...fields, email });
        router.push('/resetPassword');
      }
    });
  };

  return (
    <Fragment>
      <p className="lead mb-3 text-start">
        Please enter the 6-digit code sent to <strong>{email}</strong> to continue.
      </p>

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
            type="text"
            value={fields.code}
            id="code"
            placeholder="Code"
            maxLength={6}
            className={`form-control ${validationError.code?.message ? 'is-invalid' : ''}`}
            onChange={(e) => setFields({ ...fields, code: e.target.value })}
          />
          <label htmlFor="code">Code</label>
          {validationError.code?.message && (
            <span id="validationServerUsernameFeedback" className="invalid-feedback">
              {validationError.code?.message}
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

export default VerifyCodeForm;
