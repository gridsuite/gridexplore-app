/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    UniqueNameInput,
    ElementType,
    FieldConstants,
    DescriptionField,
    unscrollableDialogStyles,
} from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { AppState } from 'redux/types';
import Box from '@mui/material/Box';

export default function CompositeModificationForm() {
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    return (
        <>
            <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                <UniqueNameInput
                    name={FieldConstants.NAME}
                    label="nameProperty"
                    elementType={ElementType.MODIFICATION}
                    activeDirectory={activeDirectory}
                />
            </Box>
            <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                <DescriptionField />
            </Box>
        </>
    );
}
