'use client';

import React, { useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const ErrorDialogue = ({ title = "Error", message ='Something went wrong!', showError, onClose }) => {
    useEffect(() => {
        if (showError) {
            MySwal.fire({
                title: title,
                text: message,
                icon: 'error',
                confirmButtonText: 'OK',
            }).then(() => {
                if (onClose) {
                    onClose(); 
                }
            });
        }
    }, [showError]); 

    return null; 
};

const OkDialogue = ({ title = "Successfully", message = 'Your update was save Successfully!', showSuccess, onClose }) => {
    useEffect(() => {
        if (showSuccess) {
            MySwal.fire({
                title: title,
                text: message,
                icon: 'success',
                confirmButtonText: 'OK',
            }).then(() => {
                if (onClose) {
                    onClose();
                }
            });
        }
    }, [showSuccess]);

    return null;
};

export { OkDialogue }
export default ErrorDialogue;
