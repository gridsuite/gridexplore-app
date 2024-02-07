import { useController } from 'react-hook-form';
import { useState } from 'react';
import PopupConfirmationDialog from '../../popup-confirmation-dialog';

const InputWithPopupConfirmation = ({
    Input,
    name,
    shouldOpenPopup, // condition to open popup confirmation
    resetOnConfirmation, // function to reset values in your form on confirmation,
    message,
    validateButtonLabel,
    ...props
}) => {
    const [newValue, setNewValue] = useState(null);
    const [openPopup, setOpenPopup] = useState(false);
    const {
        field: { onChange },
    } = useController({
        name,
    });

    const handleOnChange = (event, value) => {
        if (shouldOpenPopup()) {
            setOpenPopup(true);
            setNewValue(value);
        } else {
            onChange(value);
        }
    };

    const handlePopupConfirmation = () => {
        resetOnConfirmation && resetOnConfirmation();
        onChange(newValue);
        setOpenPopup(false);
    };

    return (
        <>
            <Input
                name={name}
                {...props}
                onChange={(e, value) => {
                    handleOnChange(e, value?.id ?? value);
                }}
            />
            <PopupConfirmationDialog
                message={message}
                openConfirmationPopup={openPopup}
                setOpenConfirmationPopup={setOpenPopup}
                handlePopupConfirmation={handlePopupConfirmation}
                validateButtonLabel={validateButtonLabel}
            />
        </>
    );
};

InputWithPopupConfirmation.defaultProps = {
    validateButtonLabel: undefined,
};

export default InputWithPopupConfirmation;
