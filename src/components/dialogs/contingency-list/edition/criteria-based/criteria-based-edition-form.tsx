/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Box, Grid } from '@mui/material';
import {
    CriteriaBasedForm,
    DescriptionField,
    ElementType,
    FieldConstants,
    getCriteriaBasedFormData,
    UniqueNameInput,
    unscrollableDialogStyles,
} from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { elementExists } from '../../../../../utils/rest-api';
import { AppState } from '../../../../../redux/types';
import { SUPPORTED_CONTINGENCY_LIST_EQUIPMENTS } from '../../contingency-list-utils';

export default function CriteriaBasedEditionForm() {
    const emptyValues = getCriteriaBasedFormData();
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                    <UniqueNameInput
                        name={FieldConstants.NAME}
                        label="nameProperty"
                        elementType={ElementType.CONTINGENCY_LIST}
                        activeDirectory={activeDirectory}
                        elementExists={elementExists}
                    />
                </Box>
                <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                    <DescriptionField />
                </Box>
            </Grid>
            <Grid item xs={12}>
                <CriteriaBasedForm
                    equipments={SUPPORTED_CONTINGENCY_LIST_EQUIPMENTS}
                    defaultValues={emptyValues[FieldConstants.CRITERIA_BASED]}
                />
            </Grid>
        </Grid>
    );
}
