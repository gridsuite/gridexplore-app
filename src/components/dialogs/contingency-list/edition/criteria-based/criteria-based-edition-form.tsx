/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Box } from '@mui/material';
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
import { AppState } from '../../../../../redux/types';
import { SUPPORTED_CONTINGENCY_LIST_EQUIPMENTS } from '../../contingency-list-utils';

export default function CriteriaBasedEditionForm() {
    const emptyValues = getCriteriaBasedFormData();
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    return (
        <>
            <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                <UniqueNameInput
                    name={FieldConstants.NAME}
                    label="nameProperty"
                    elementType={ElementType.CONTINGENCY_LIST}
                    activeDirectory={activeDirectory}
                />
            </Box>
            <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                <DescriptionField />
            </Box>

            <CriteriaBasedForm
                equipments={SUPPORTED_CONTINGENCY_LIST_EQUIPMENTS}
                defaultValues={emptyValues[FieldConstants.CRITERIA_BASED]}
            />
        </>
    );
}
