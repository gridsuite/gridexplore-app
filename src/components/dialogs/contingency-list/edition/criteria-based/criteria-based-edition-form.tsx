/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Grid } from '@mui/material';
import {
    UniqueNameInput,
    ElementType,
    CriteriaBasedForm,
    getCriteriaBasedFormData,
    CONTINGENCY_LIST_EQUIPMENTS,
    FieldConstants,
} from '@gridsuite/commons-ui';
import { elementExists } from 'utils/rest-api';
import { useSelector } from 'react-redux';
import { AppState } from 'redux/reducer';

function CriteriaBasedEditionForm() {
    const emptyValues = getCriteriaBasedFormData({}, {});
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    return (
        <Grid container spacing={2} marginTop="auto">
            <Grid item xs={12}>
                <UniqueNameInput
                    name={FieldConstants.NAME}
                    label="nameProperty"
                    elementType={ElementType.CONTINGENCY_LIST}
                    activeDirectory={activeDirectory}
                    elementExists={elementExists}
                />
            </Grid>
            <CriteriaBasedForm
                equipments={CONTINGENCY_LIST_EQUIPMENTS}
                defaultValues={emptyValues[FieldConstants.CRITERIA_BASED]}
            />
        </Grid>
    );
}

export default CriteriaBasedEditionForm;
