/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { CircularProgress, InputAdornment } from '@mui/material';
import { elementExists } from '../../../utils/rest-api';
import CheckIcon from '@mui/icons-material/Check';
import { useSelector } from 'react-redux';
import { useDebounce } from '@gridsuite/commons-ui';
import { FieldError } from 'react-hook-form';
import { ElementType } from '../../../utils/elementType';
import { ReduxState } from '../../../redux/reducer.type';

export type NameCheckReturn = [ReactElement | null, boolean];

interface INameCheckProps<T> {
    field: keyof T;
    value: string;
    elementType: ElementType;
    setError: (field: keyof T, error: FieldError) => void;
}

export const useNameCheck = <T extends Record<string, any>>({
    field,
    value,
    elementType,
    setError,
}: INameCheckProps<T>): NameCheckReturn => {
    const intl = useIntl();

    const [adornment, setAdornment] = useState<ReactElement | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const activeDirectory = useSelector(
        (state: ReduxState) => state.activeDirectory
    );

    const handleCheckName = useCallback(() => {
        const valueFormatted = value.replace(/ /g, '');

        if (!valueFormatted) {
            setAdornment(null);
        } else {
            elementExists(activeDirectory, valueFormatted, elementType)
                .then((isElementExists) => {
                    if (isElementExists) {
                        setError(field, {
                            type: 'nameAlreadyUsed',
                            message: intl.formatMessage({
                                id: 'nameAlreadyUsed',
                            }),
                        });
                        setAdornment(null);
                    } else {
                        setAdornment(
                            <InputAdornment position="end">
                                <CheckIcon sx={{ color: 'green' }} />
                            </InputAdornment>
                        );
                    }
                })
                .catch((error) =>
                    setError(field, {
                        type: 'nameValidityCheckErrorMsg',
                        message:
                            intl.formatMessage({
                                id: 'nameValidityCheckErrorMsg',
                            }) + (error as Error).message,
                    })
                );
        }

        setIsChecking(false);
    }, [value, field, setError, intl, activeDirectory, elementType]);

    const debouncedHandleCheckName = useDebounce(handleCheckName, 700);

    // handle check case name
    useEffect(() => {
        setIsChecking(true);
        setAdornment(
            <InputAdornment position="end">
                <CircularProgress size="1rem" />
            </InputAdornment>
        );

        debouncedHandleCheckName();

        if (!value) {
            setAdornment(null);
        }
    }, [debouncedHandleCheckName, value]);

    return [adornment, isChecking];
};
