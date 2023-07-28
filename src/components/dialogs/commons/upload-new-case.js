import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import { FormattedMessage } from 'react-intl';
import CircularProgress from '@mui/material/CircularProgress';
import { Grid } from '@mui/material';

const UploadNewCase = ({ caseFile, caseFileLoading, handleCaseFileUpload }) => {
    const { name: caseFileName } = caseFile || {};

    return (
        <Grid container alignItems="center" spacing={1} pt={1}>
            <Grid item>
                <Button variant="contained" color="primary" component="label">
                    <FormattedMessage id="uploadCase" />
                    <input
                        type="file"
                        name="file"
                        onChange={handleCaseFileUpload}
                        style={{ display: 'none' }}
                    />
                </Button>
            </Grid>
            <Grid item>
                <p>
                    {caseFileLoading ? (
                        <CircularProgress size="1rem" />
                    ) : caseFileName ? (
                        <span>{caseFileName}</span>
                    ) : (
                        <FormattedMessage id="uploadMessage" />
                    )}
                </p>
            </Grid>
        </Grid>
    );
};

UploadNewCase.propTypes = {};

export default UploadNewCase;
