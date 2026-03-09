/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FieldConstants, MAX_CHAR_DESCRIPTION, yupConfig as yup } from '@gridsuite/commons-ui';
import type { UUID } from 'node:crypto';

export const getCreateCaseDialogFormValidationDefaultValues = () => ({
    [FieldConstants.CASE_NAME]: '',
    [FieldConstants.DESCRIPTION]: '',
    [FieldConstants.CASE_FILE]: null,
    [FieldConstants.CASE_UUID]: null,
});

export const createCaseDialogFormValidationSchema = yup.object().shape({
    [FieldConstants.CASE_NAME]: yup.string().trim().required('nameEmpty'),
    [FieldConstants.DESCRIPTION]: yup.string().max(MAX_CHAR_DESCRIPTION),
    [FieldConstants.CASE_FILE]: yup.mixed<File>().nullable().required(),
    [FieldConstants.CASE_UUID]: yup.string<UUID>().uuid().required(),
});
