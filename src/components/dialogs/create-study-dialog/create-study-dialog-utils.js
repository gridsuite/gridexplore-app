import {
    CASE_FILE,
    CASE_UUID,
    CURRENT_PARAMETERS,
    DESCRIPTION,
    FORMATTED_CASE_PARAMETERS,
    STUDY_NAME,
} from '../../utils/field-constants';

export const getCreateStudyDialogFormDefaultValues = () => {
    return {
        [STUDY_NAME]: '',
        [DESCRIPTION]: '',
        [CASE_FILE]: null,
        [CASE_UUID]: '',
        [FORMATTED_CASE_PARAMETERS]: [],
        [CURRENT_PARAMETERS]: {},
    };
};
