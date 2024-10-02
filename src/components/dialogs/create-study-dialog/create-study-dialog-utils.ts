/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ElementAttributes, FieldConstants, Parameter, yup } from '@gridsuite/commons-ui';

export const getCreateStudyDialogFormDefaultValues = ({
    directory = '',
    studyName = '',
    caseFile = null,
    caseUuid = '',
}: {
    directory?: string;
    studyName?: string;
    caseFile?: ElementAttributes | null;
    caseUuid?: string;
}): CreateStudyDialogFormValues => {
    return {
        [FieldConstants.STUDY_NAME]: studyName,
        [FieldConstants.DESCRIPTION]: '',
        [FieldConstants.CASE_FILE]: caseFile,
        [FieldConstants.CASE_UUID]: caseUuid,
        [FieldConstants.FORMATTED_CASE_PARAMETERS]: [],
        [FieldConstants.CURRENT_PARAMETERS]: {},
        [FieldConstants.DIRECTORY]: directory,
        [FieldConstants.CASE_FORMAT]: '',
        [FieldConstants.CASE_NAME]: '',
    };
};

export const createStudyDialogFormValidationSchema = yup.object().shape({
    [FieldConstants.STUDY_NAME]: yup.string().trim().required('nameEmpty'),
    [FieldConstants.FORMATTED_CASE_PARAMETERS]: yup.mixed<Parameter[]>().required(),
    [FieldConstants.DESCRIPTION]: yup.string().max(500, 'descriptionLimitError'),
    [FieldConstants.CURRENT_PARAMETERS]: yup.mixed<Record<string, string>>().required(),
    [FieldConstants.CASE_UUID]: yup.string().nullable().required(),
    [FieldConstants.CASE_FILE]: yup.mixed<ElementAttributes>().nullable().required(),
    [FieldConstants.DIRECTORY]: yup.string().required(),
    [FieldConstants.CASE_FORMAT]: yup.string().optional(),
    [FieldConstants.CASE_NAME]: yup.string().optional(),
});

export interface CreateStudyDialogFormValues {
    [FieldConstants.STUDY_NAME]: string;
    [FieldConstants.DESCRIPTION]?: string;
    [FieldConstants.CASE_FILE]: ElementAttributes | null;
    [FieldConstants.CASE_UUID]: string | null;
    [FieldConstants.FORMATTED_CASE_PARAMETERS]: Parameter[];
    [FieldConstants.CURRENT_PARAMETERS]: Record<string, string>;
    [FieldConstants.DIRECTORY]: string;
    [FieldConstants.CASE_FORMAT]?: string;
    [FieldConstants.CASE_NAME]?: string;
}
