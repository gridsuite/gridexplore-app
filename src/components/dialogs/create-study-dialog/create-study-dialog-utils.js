import {
    CASE_FILE,
    CASE_UUID,
    CURRENT_PARAMETERS,
    DESCRIPTION,
    FORMATTED_CASE_PARAMETERS,
    STUDY_NAME,
    DIRECTORY,
} from '../../utils/field-constants';
import yup from '../../utils/yup-config';

export const getCreateStudyDialogFormDefaultValues = ({ directory = '' }) => {
    return {
        [STUDY_NAME]: '',
        [DESCRIPTION]: '',
        [CASE_FILE]: null,
        [CASE_UUID]: '',
        [FORMATTED_CASE_PARAMETERS]: [],
        [CURRENT_PARAMETERS]: {},
        [DIRECTORY]: directory,
    };
};

export const createStudyDialogFormValidationSchema = yup.object().shape({
    [STUDY_NAME]: yup.string().required(),
    [FORMATTED_CASE_PARAMETERS]: yup.mixed().required(),
    [DESCRIPTION]: yup.string(),
    [CURRENT_PARAMETERS]: yup.mixed().required(),
    [CASE_UUID]: yup.string().required(),
    [CASE_FILE]: yup.mixed().nullable().required(),
    [DIRECTORY]: yup.string().required(),
});
