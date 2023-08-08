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

interface NameCheckProps {
    name: string;
    nameChanged: boolean;
    elementType: string;
}

export type NameCheckReturn = [React.ReactNode | null, string, boolean];

export const useNameCheck = ({
    name,
    nameChanged,
    elementType,
}: NameCheckProps): NameCheckReturn => {
    const intl = useIntl();

    const [adornment, setAdornment] = useState<React.ReactNode | null>(null);
    const [nameError, setNameError] = useState<string>('');
    const [isChecking, setIsChecking] = useState<boolean>(false);

    const activeDirectory = useSelector((state: any) => state.activeDirectory);

    const handleCheckName = useCallback(() => {
        const nameFormatted = name.replace(/ /g, '');
        setNameError('');

        if (!nameFormatted) {
            setAdornment(false);

            if (nameChanged) {
                setNameError(intl.formatMessage({ id: 'nameEmpty' }));
            }
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
                        setNameError(
                            intl.formatMessage({
                                id: 'nameAlreadyUsed',
                            })
                        );
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
                    setNameError(
                        intl.formatMessage({
                            id: 'nameValidityCheckErrorMsg',
                        }) + (error as Error).message
                    )
                )
                .finally(() => setIsChecking(false));
        }
    }, [activeDirectory, elementType, intl, name, nameChanged]);

    // handle check case name
    useEffect(() => {
        handleCheckName();
    }, [handleCheckName]);

    return [adornment, nameError, isChecking];
};
