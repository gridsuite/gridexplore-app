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
    [CASE_FILE]: yup.mixed<File>().nullable().required(),
});
