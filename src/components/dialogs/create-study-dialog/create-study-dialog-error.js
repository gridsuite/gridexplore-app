import PropTypes from 'prop-types';
import { Alert } from '@mui/material';

const CreateStudyDialogError = ({ error, providedCaseFileError }) => {
    return (
        <div>
            {error !== '' && (
                <Alert
                    style={{
                        marginTop: '10px',
                    }}
                    severity="error"
                >
                    {error}
                </Alert>
            )}
            {providedCaseFileError && (
                <Alert severity="error">{providedCaseFileError}</Alert>
            )}
        </div>
    );
};

CreateStudyDialogError.propTypes = {};

export default CreateStudyDialogError;
