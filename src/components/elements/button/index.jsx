import React from 'react';
import { Button, Spinner } from 'react-bootstrap';

const LoadingButton = ({ loading, onClick, title = 'Sign In', disabled = false }) => {
    return loading ? (
        <Button variant="primary" disabled className="w-100 mb-2">
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            <span className="visually-hidden">Loading...</span>
        </Button>
    ) : (
        <button
            type="button"
                disabled={disabled}
                className="btn text-white bg__purple rounded-pill btn-login w-100 mb-2"
            onClick={onClick}
        >
                {title}
        </button>
    );
};

export default LoadingButton;
