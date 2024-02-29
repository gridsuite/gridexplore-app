/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FunctionComponent } from 'react';
import { DESCRIPTION } from '../../utils/field-constants';
import { InputAdornment, SxProps } from '@mui/material';
import { TextInput } from '@gridsuite/commons-ui';
import React, { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

interface IDescriptionInput {
    maxCharactersNumber?: number;
    rows?: number;
    minRows?: number;
    maxRows?: number;
    sx?: SxProps;
    noLabel?: boolean;
}

const DescriptionInput: FunctionComponent<IDescriptionInput> = ({
    maxCharactersNumber,
    rows,
    minRows,
    maxRows,
    sx,
    noLabel,
}) => {
    const { control } = useFormContext();
    const descriptionWatch = useWatch({
        name: `${DESCRIPTION}`,
        control,
    });

    const maxCounter = maxCharactersNumber ?? 500;
    const isOverTheLimit = descriptionWatch?.length > maxCounter;
    const descriptionCounter = useMemo(() => {
        const descriptionLength = descriptionWatch?.length ?? 0;
        return descriptionLength + '/' + maxCounter;
    }, [descriptionWatch, maxCounter]);

    const formProps = {
        size: 'medium' as const,
        multiline: true,
        InputProps: {
            endAdornment: (
                <InputAdornment
                    color={'red'}
                    position="end"
                    sx={{
                        position: 'absolute',
                        bottom: 10,
                        right: 8,
                    }}
                >
                    <div
                        style={{
                            color: isOverTheLimit ? 'red' : 'inherit',
                        }}
                    >
                        {descriptionCounter}
                    </div>
                </InputAdornment>
            ),
        },
        ...(minRows && { minRows: minRows }),
        ...(rows && { rows: rows }),
        ...(maxRows && { maxRows: maxRows }),
        ...(sx && { sx: sx }),
    };
    return (
        <TextInput
            name={DESCRIPTION}
            label={noLabel ? undefined : 'descriptionProperty'}
            formProps={formProps}
        />
    );
};

export default DescriptionInput;
