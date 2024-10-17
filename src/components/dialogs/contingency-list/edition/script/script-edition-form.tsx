/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Box } from '@mui/material';
import ScriptInputForm from '../../script/script-input-form';
import { UniqueNameInput, ElementType, FieldConstants, unscrollableDialogStyles, mergeSx } from '@gridsuite/commons-ui';
import { elementExists } from 'utils/rest-api';
import { useSelector } from 'react-redux';
import { AppState } from 'redux/reducer';

const ScriptEditionForm = () => {
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    return (
        <>
            <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                <UniqueNameInput
                    name={FieldConstants.NAME}
                    label={'nameProperty'}
                    elementType={ElementType.CONTINGENCY_LIST}
                    activeDirectory={activeDirectory}
                    elementExists={elementExists}
                />
            </Box>
            <Box sx={mergeSx(unscrollableDialogStyles.scrollableContent, { display: 'flex' })}>
                <ScriptInputForm />
            </Box>
        </>
    );
};

export default ScriptEditionForm;
