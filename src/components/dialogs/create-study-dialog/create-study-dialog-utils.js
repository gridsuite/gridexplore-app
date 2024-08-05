/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import yup from '../../utils/yup-config';
import { FieldConstants } from '@gridsuite/commons-ui';

export const getCreateStudyDialogFormDefaultValues = ({
    directory = '',
    studyName = '',
    caseFile = null,
    caseUuid = '',
}) => {
    return {
        [FieldConstants.STUDY_NAME]: studyName,
        [FieldConstants.DESCRIPTION]: '',
        [FieldConstants.CASE_FILE]: caseFile,
        [FieldConstants.CASE_UUID]: caseUuid,
        [FieldConstants.FORMATTED_CASE_PARAMETERS]: [],
        [FieldConstants.CURRENT_PARAMETERS]: {},
        [FieldConstants.DIRECTORY]: directory,
        [FieldConstants.CASE_FORMAT]: '',
    };
};

export const createStudyDialogFormValidationSchema = yup.object().shape({
    [FieldConstants.STUDY_NAME]: yup.string().trim().required('nameEmpty'),
    [FieldConstants.FORMATTED_CASE_PARAMETERS]: yup.mixed().required(),
    [FieldConstants.DESCRIPTION]: yup.string().max(500, 'descriptionLimitError'),
    [FieldConstants.CURRENT_PARAMETERS]: yup.mixed().required(),
    [FieldConstants.CASE_UUID]: yup.string().required(),
    [FieldConstants.CASE_FILE]: yup.mixed().nullable().required(),
    [FieldConstants.DIRECTORY]: yup.string().required(),
    [FieldConstants.CASE_FORMAT]: yup.string().optional(),
});
