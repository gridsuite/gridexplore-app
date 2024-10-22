/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Box } from '@mui/material';
import ExplicitNamingForm from '../../explicit-naming/explicit-naming-form';
import { ElementType, UniqueNameInput, FieldConstants, unscrollableDialogStyles } from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { elementExists } from 'utils/rest-api';
import { AppState } from 'redux/reducer';

const ExplicitNamingEditionForm = () => {
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
            <ExplicitNamingForm />
        </>
    );
};

export default ExplicitNamingEditionForm;
