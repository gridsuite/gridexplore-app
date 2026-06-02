/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FieldConstants, TextInput, unscrollableDialogStyles } from '@gridsuite/commons-ui';
import { Box } from '@mui/material';
import { useFormContext } from 'react-hook-form';

export default function CompositeModificationForm() {
    const { getValues } = useFormContext();
    const name = getValues(FieldConstants.NAME);
    return (
        <>
            <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                <TextInput
                    name={FieldConstants.NAME}
                    label="name"
                    formProps={{
                        disabled: true,
                        sx: {
                            minWidth: '50ch',
                            width: `${String(name ?? '').length}ch`,
                            maxWidth: '100%',
                        },
                    }}
                />
            </Box>
            <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                <TextInput
                    name={FieldConstants.DESCRIPTION}
                    label="description"
                    formProps={{
                        disabled: true,
                    }}
                />
            </Box>
        </>
    );
}
