/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FieldConstants, TextInput, unscrollableDialogStyles } from '@gridsuite/commons-ui';
import { Box } from '@mui/material';

export default function CompositeModificationForm() {
    return (
        <>
            <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                <TextInput
                    name={FieldConstants.NAME}
                    label="name"
                    formProps={{
                        disabled: true,
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
