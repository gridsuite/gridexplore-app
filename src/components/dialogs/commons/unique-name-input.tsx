import React, {
    ChangeEvent,
    FunctionComponent,
    useCallback,
    useEffect,
} from 'react';
import { useDebounce } from '@gridsuite/commons-ui';
import { elementExists } from '../../../utils/rest-api';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { ReduxState } from '../../../redux/reducer.type';
import { InputAdornment } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useController, useFormContext } from 'react-hook-form';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';

interface UniqueNameInputProps {
    name: string;
    label?: string;
    elementType: string;
    autoFocus?: boolean;
    onManualChangeCallback?: () => void;
}

/**
 * Input component that constantly check if the field's value is available or not
 */
export const UniqueNameInput: FunctionComponent<UniqueNameInputProps> = (
    props
) => {
    const {
        field: { onChange, onBlur, value, name, ref },
        fieldState: { error, isDirty },
    } = useController({
        name: props.name,
    });

    const {
        setError,
        clearErrors,
        formState: { errors },
    } = useFormContext();

    // This is a trick to share the custom validation state among the form : while this error is present, we can't validate the form
    const isValidating = errors.root?.isValidating;

    const activeDirectory = useSelector(
        (state: ReduxState) => state.activeDirectory
    );

    const handleCheckName = useCallback(
        (value: string) => {
            if (value) {
                elementExists(activeDirectory, value, props.elementType)
                    .then((alreadyExist) => {
                        if (alreadyExist) {
                            setError(props.name, {
                                type: 'validate',
                                message: 'nameAlreadyUsed',
                            });
                        }
                    })
                    .catch((error) => {
                        setError(props.name, {
                            type: 'validate',
                            message: 'nameValidityCheckErrorMsg',
                        });
                        console.error(error?.message);
                    })
                    .finally(() => {
                        clearErrors('root.isValidating');
                    });
            }
        },
        [setError, clearErrors, activeDirectory, props.name, props.elementType]
    );

    const debouncedHandleCheckName = useDebounce(handleCheckName, 700);

    // We have to use an useEffect because the name can change from outside of this component (when we upload a case file for instance)
    useEffect(() => {
        // if the name is unchanged, we don't do custom validation
        if (!isDirty) {
            clearErrors(props.name);
            return;
        }
        const trimmedValue = value.trim();
        if (trimmedValue) {
            clearErrors(props.name);
            setError('root.isValidating', {
                type: 'validate',
                message: 'cantSubmitWhileValidating',
            });
            debouncedHandleCheckName(trimmedValue);
        } else {
            clearErrors('root.isValidating');
            setError(props.name, {
                type: 'validate',
                message: 'nameEmpty',
            });
        }
    }, [
        debouncedHandleCheckName,
        setError,
        clearErrors,
        props.name,
        value,
        isDirty,
    ]);

    // Handle on user's change
    const handleManualChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        onChange(e.target.value);
        props.onManualChangeCallback && props.onManualChangeCallback();
    };

    const translatedLabel = <FormattedMessage id={props.label} />;

    const translatedError = error && <FormattedMessage id={error.message} />;

    const showOk = value?.trim() && !isValidating && !error;
    const endAdornment = (
        <InputAdornment position="end">
            {isValidating && <CircularProgress size="1rem" />}
            {showOk && <CheckIcon style={{ color: 'green' }} />}
        </InputAdornment>
    );

    return (
        <TextField
            onChange={handleManualChange}
            onBlur={onBlur}
            value={value}
            name={name}
            inputRef={ref}
            label={translatedLabel}
            type="text"
            autoFocus={props.autoFocus}
            margin="dense"
            fullWidth
            error={!!error}
            helperText={translatedError}
            InputProps={{ endAdornment: endAdornment }}
        />
    );
};
