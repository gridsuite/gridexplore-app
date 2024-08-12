/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Grid } from '@mui/material';
import {
    CONTINGENCY_LIST_EQUIPMENTS,
    CriteriaBasedForm,
    ElementType,
    FieldConstants,
    getCriteriaBasedFormData,
    UniqueNameInput,
} from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';

const CriteriaBasedEditionForm = () => {
    const emptyValues = getCriteriaBasedFormData();
    const activeDirectory = useSelector((state) => state.activeDirectory);
    return (
        <Grid container spacing={2} marginTop={'auto'}>
            <Grid item xs={12}>
                <UniqueNameInput
                    name={FieldConstants.NAME}
                    label={'nameProperty'}
                    elementType={ElementType.CONTINGENCY_LIST}
                    activeDirectory={activeDirectory}
                />
            </Grid>
            <CriteriaBasedForm
                equipments={CONTINGENCY_LIST_EQUIPMENTS}
                defaultValues={emptyValues[FieldConstants.CRITERIA_BASED]}
            />
        </Grid>
    );
};

export default CriteriaBasedEditionForm;
