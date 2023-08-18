/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { CircularProgress, InputAdornment } from '@mui/material';
import { elementExists } from '../../../utils/rest-api';
import CheckIcon from '@mui/icons-material/Check';
import { useSelector } from 'react-redux';
// @ts-ignore
import { useDebounce } from '@gridsuite/commons-ui';

interface INameCheckProps {
    field: string;
    name: string;
    elementType: string;
    setError: any;
}

export type NameCheckReturn = [React.ReactNode, boolean];

export const useNameCheck = ({
    field,
    name,
    elementType,
    setError,
}: INameCheckProps): NameCheckReturn => {
    const intl = useIntl();

    const [adornment, setAdornment] = useState<React.ReactNode>(null);
    const [isChecking, setIsChecking] = useState<boolean>(false);

    const activeDirectory = useSelector((state: any) => state.activeDirectory);

    const handleCheckName = useCallback(() => {
        const nameFormatted = name.replace(/ /g, '');

        if (!nameFormatted) {
            setAdornment(false);
        } else {
            setIsChecking(true);

            setAdornment(
                <InputAdornment position="end">
                    <CircularProgress size="1rem" />
                </InputAdornment>
            );

            elementExists(activeDirectory, name, elementType)
                .then((isElementExists) => {
                    if (isElementExists) {
                        setError(field, {
                            type: 'nameAlreadyUsed',
                            message: intl.formatMessage({
                                id: 'nameAlreadyUsed',
                            }),
                        });
                        setAdornment(false);
                    } else {
                        setAdornment(
                            <InputAdornment position="end">
                                <CheckIcon style={{ color: 'green' }} />
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
                )
                .finally(() => setIsChecking(false));
        }
    }, [name, field, setError, intl, activeDirectory, elementType]);

    const debouncedHandleCheckName = useDebounce(handleCheckName, 700);

    // handle check case name
    useEffect(() => {
        debouncedHandleCheckName();

        if (!name) {
            setAdornment(false);
        }
    }, [debouncedHandleCheckName, name]);

    return [adornment, isChecking];
};
