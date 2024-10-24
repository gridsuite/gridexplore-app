/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { UniqueNameInput, ElementType, FieldConstants } from '@gridsuite/commons-ui';
import { elementExists } from 'utils/rest-api';
import { useSelector } from 'react-redux';
import { AppState } from 'redux/reducer';
import Box from '@mui/material/Box';

const CompositeModificationEditionForm = () => {
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    return (
        <Box>
            <UniqueNameInput
                name={FieldConstants.NAME}
                label={'nameProperty'}
                elementType={ElementType.MODIFICATION}
                activeDirectory={activeDirectory}
                elementExists={elementExists}
            />
        </Box>
    );
};

export default CompositeModificationEditionForm;
