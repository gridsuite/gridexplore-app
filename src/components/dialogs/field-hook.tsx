/*
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { CircularProgress, InputAdornment, TextField, TextFieldProps } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { ElementType, useDebounce } from '@gridsuite/commons-ui';
import { UUID } from 'crypto';
import { elementExists, rootDirectoryExists } from '../../utils/rest-api';

const styles = {
    helperText: {
        margin: 0,
        marginTop: 4,
    },
};

export interface UseTextValueProps extends Omit<TextFieldProps, 'label' | 'defaultValue'> {
    label: string;
    id?: string;
    defaultValue?: string;
    adornment?: ReactNode;
}

export const useTextValue = ({
    label,
    id = label,
    defaultValue = '',
    adornment,
    ...formProps
}: UseTextValueProps): [string, ReactNode, (value: string) => void, boolean] => {
    const [value, setValue] = useState(defaultValue);
    const [hasChanged, setHasChanged] = useState(false);

    const handleChangeValue = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
        setHasChanged(true);
    }, []);

    const field = useMemo(
        () => (
            <TextField
                key={id}
                margin="dense"
                id={id}
                label={id && <FormattedMessage id={label} />}
                value={value}
                style={{ width: '100%' }}
                onChange={handleChangeValue}
                FormHelperTextProps={{
                    sx: styles.helperText,
                }}
                {...formProps}
                InputProps={{
                    endAdornment: adornment,
                }}
            />
        ),
        [id, label, value, handleChangeValue, formProps, adornment]
    );

    useEffect(() => setValue(defaultValue), [defaultValue]);

    return [value, field, setValue, hasChanged];
};

export interface UseNameFieldProps extends UseTextValueProps {
    parentDirectoryId?: UUID | null;
    elementType: ElementType;
    active: boolean;
    alreadyExistingErrorMessage?: string;
}

export const useNameField = ({
    parentDirectoryId,
    elementType,
    active,
    alreadyExistingErrorMessage,
    ...props
}: UseNameFieldProps): [string, ReactNode, string | undefined, boolean, (value: string) => void, boolean] => {
    const [error, setError] = useState<string | undefined>();
    const intl = useIntl();
    const [checking, setChecking] = useState<boolean | undefined>(undefined);

    // if element is a root directory, we need to make a specific api rest call (elementType is directory, and no parent element)
    const doesElementExist = useCallback(
        (name: string) =>
            elementType === ElementType.DIRECTORY && !parentDirectoryId
                ? rootDirectoryExists(name)
                : elementExists(parentDirectoryId, name, elementType),
        [elementType, parentDirectoryId]
    );

    const updateValidity = useCallback(
        (name: string, touched: boolean) => {
            const nameFormatted = name.replace(/ /g, '');
            if (nameFormatted === '' && touched) {
                setError(intl.formatMessage({ id: 'nameEmpty' }));
                setChecking(false);
                return;
            }
            if (nameFormatted === '' && !touched) {
                setChecking(undefined);
                return;
            }

            if (nameFormatted !== '' && name === props.defaultValue) {
                setError(
                    alreadyExistingErrorMessage ||
                        intl.formatMessage({
                            id: 'nameAlreadyUsed',
                        })
                );
                setChecking(false);
            }
            if (nameFormatted !== '') {
                // If the name is not only white spaces and not defaultValue
                doesElementExist(name)
                    .then((data) => {
                        setError(
                            data
                                ? alreadyExistingErrorMessage ||
                                      intl.formatMessage({
                                          id: 'nameAlreadyUsed',
                                      })
                                : ''
                        );
                    })
                    .catch((error2) => {
                        setError(
                            intl.formatMessage({
                                id: 'nameValidityCheckErrorMsg',
                            }) + error2.message
                        );
                    })
                    .finally(() => {
                        setChecking(false);
                    });
            }
        },
        [props.defaultValue, alreadyExistingErrorMessage, intl, doesElementExist]
    );

    const debouncedUpdateValidity = useDebounce(updateValidity, 700);

    const adornment = useMemo(() => {
        if (checking === undefined || error) {
            return undefined;
        }
        if (checking) {
            return (
                <InputAdornment position="end">
                    <CircularProgress size="1rem" />
                </InputAdornment>
            );
        }
        return (
            <InputAdornment position="end">
                <CheckIcon style={{ color: 'green' }} />
            </InputAdornment>
        );
    }, [checking, error]);

    const [name, field, setName, touched] = useTextValue({
        ...props,
        error: !!error,
        adornment,
    });

    useEffect(() => {
        if (!active || name === '' || name === props.defaultValue) {
            return; // initial render or hook in closed component to avoid sending unexpected request
        }
        setChecking(true);
        setError(undefined);
        debouncedUpdateValidity(name, touched);
    }, [active, props.defaultValue, name, debouncedUpdateValidity, touched]);

    return [
        name,
        field,
        error,
        name !== props.defaultValue && name.replace(/ /g, '') !== '' && !error && !checking,
        setName,
        touched,
    ];
};
