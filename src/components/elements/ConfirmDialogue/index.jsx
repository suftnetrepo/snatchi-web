'use client';

import React, { useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const DeleteConfirmation = ({ title = 'Are you sure?', message = 'You won’t be able to revert this!', onConfirm, onCancel, itemId, children }) => {
    const showConfirmation = () => {
        MySwal.fire({
            title: title ,
            text: message ,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                onConfirm(itemId); 
            } else if (onCancel) {
                onCancel(itemId); 
            }
        });
    };

    return React.cloneElement(children, { onClick: showConfirmation });
};

export default DeleteConfirmation

export const ConfirmationDialogue = ({ iconType ='success', show = false, title = 'Successfully!', message = 'Do want to created another project?', onConfirm, onClose }) => {
     useEffect(() => {
            if (show) {
                MySwal.fire({
                    title: title,
                    text: message,
                    icon: iconType,
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No',
                }).then((result) => {
                    if (result.isConfirmed) {
                        onConfirm();
                    } else if (onClose) {
                        onClose();
                    }
                });
            }
     }, [show]); 
    
    return null;
};


