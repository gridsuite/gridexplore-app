/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FieldConstants, yupConfig as yup } from '@gridsuite/commons-ui';

export const getCreateCaseDialogFormValidationDefaultValues = () => ({
    [FieldConstants.CASE_NAME]: '',
    [FieldConstants.DESCRIPTION]: '',
    [FieldConstants.CASE_FILE]: null,
});

export const createCaseDialogFormValidationSchema = yup.object().shape({
    [FieldConstants.CASE_NAME]: yup.string().trim().required('nameEmpty'),
    [FieldConstants.DESCRIPTION]: yup.string().max(500, 'descriptionLimitError'),
    [FieldConstants.CASE_FILE]: yup.mixed<File>().nullable().required(),
});
