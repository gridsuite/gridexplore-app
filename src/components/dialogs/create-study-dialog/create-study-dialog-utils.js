/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    CASE_FILE,
    CASE_UUID,
    CURRENT_PARAMETERS,
    DESCRIPTION,
    FORMATTED_CASE_PARAMETERS,
    STUDY_NAME,
    DIRECTORY,
    CASE_FORMAT,
} from '../../utils/field-constants';
import yup from '../../utils/yup-config';

export const getCreateStudyDialogFormDefaultValues = ({
    directory = '',
    studyName = '',
    caseFile = null,
    caseUuid = '',
}) => {
    return {
        [STUDY_NAME]: studyName,
        [DESCRIPTION]: '',
        [CASE_FILE]: caseFile,
        [CASE_UUID]: caseUuid,
        [FORMATTED_CASE_PARAMETERS]: [],
        [CURRENT_PARAMETERS]: {},
        [DIRECTORY]: directory,
        [CASE_FORMAT]: '',
    };
};

export const createStudyDialogFormValidationSchema = yup.object().shape({
    [STUDY_NAME]: yup.string().trim().required('nameEmpty'),
    [FORMATTED_CASE_PARAMETERS]: yup.mixed().required(),
    [DESCRIPTION]: yup.string().max(500, 'descriptionLimitError'),
    [CURRENT_PARAMETERS]: yup.mixed().required(),
    [CASE_UUID]: yup.string().required(),
    [CASE_FILE]: yup.mixed().nullable().required(),
    [DIRECTORY]: yup.string().required(),
    [CASE_FORMAT]: yup.string().optional(),
});
