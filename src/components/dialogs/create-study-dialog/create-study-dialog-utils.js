import {
    CASE_FILE,
    CASE_UUID,
    CURRENT_PARAMETERS,
    DESCRIPTION,
    FORMATTED_CASE_PARAMETERS,
    STUDY_NAME,
    ACTIVE_DIRECTORY,
} from '../../utils/field-constants';
import yup from '../../utils/yup-config';

export const getCreateStudyDialogFormDefaultValues = ({
    activeDirectory = '',
}) => {
    return {
        [STUDY_NAME]: '',
        [DESCRIPTION]: '',
        [CASE_FILE]: null,
        [CASE_UUID]: '',
        [FORMATTED_CASE_PARAMETERS]: [],
        [CURRENT_PARAMETERS]: {},
        [ACTIVE_DIRECTORY]: activeDirectory,
    };
};

export const createStudyDialogFormValidationSchema = yup.object().shape({
    [STUDY_NAME]: yup.string().required(),
    [FORMATTED_CASE_PARAMETERS]: yup.mixed(),
    [DESCRIPTION]: yup.string().nullable(),
    [CURRENT_PARAMETERS]: yup.mixed(),
    [CASE_UUID]: yup.string(),
    [CASE_FILE]: yup.mixed(),
    [ACTIVE_DIRECTORY]: yup.string(),
});
