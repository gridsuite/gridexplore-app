import { ValidationResult, ValueEditorProps } from 'react-querybuilder';

/**
 * Hook that return if a field of RQB is valid or not
 */
const useValid = ({ validation }: ValueEditorProps) => {
    if (validation === undefined || validation === null) {
        return true;
    }
    if (typeof validation === 'boolean') {
        return validation;
    }
    const convertedValidation = validation as ValidationResult;
    return convertedValidation.valid;
};

export default useValid;
