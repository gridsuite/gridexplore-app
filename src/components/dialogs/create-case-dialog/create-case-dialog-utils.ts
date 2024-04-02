/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import yup from '../../utils/yup-config';
import { CASE_FILE, CASE_NAME, DESCRIPTION } from '../../utils/field-constants';

export const getCreateCaseDialogFormValidationDefaultValues = () => ({
    [CASE_NAME]: '',
    [DESCRIPTION]: '',
    [CASE_FILE]: null,
});

export const createCaseDialogFormValidationSchema = yup.object().shape({
    [CASE_NAME]: yup.string().trim().required('nameEmpty'),
    [DESCRIPTION]: yup.string().max(500, 'descriptionLimitError'),
    [CASE_FILE]: yup.mixed().nullable().required(),
});
