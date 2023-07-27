import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import DirectorySelector from '../directory-selector';
import { setActiveDirectory } from '../../../redux/actions';
import { useDispatch } from 'react-redux';

const DirectorySelect = ({ activeDirectoryName, open, setOpen, types }) => {
    const intl = useIntl();
    const dispatch = useDispatch();

    const handleSelectFolder = () => {
        setOpen(true);
    };

    const handleClose = (directory) => {
        if (directory.length) {
            dispatch(setActiveDirectory(directory[0]?.id));
        }
        setOpen(false);
    };

    return (
        <div
            style={{
                marginTop: '10px',
            }}
        >
            <Button
                onClick={handleSelectFolder}
                variant="contained"
                style={{
                    paddingLeft: '30px',
                    paddingRight: '30px',
                }}
                color="primary"
                component="label"
            >
                <FormattedMessage id="showSelectDirectoryDialog" />
            </Button>
            <span
                style={{
                    marginLeft: '10px',
                    fontWeight: 'bold',
                }}
            >
                {activeDirectoryName}
            </span>

            <DirectorySelector
                open={open}
                onClose={handleClose}
                types={types}
                title={intl.formatMessage({
                    id: 'selectDirectoryDialogTitle',
                })}
                validationButtonText={intl.formatMessage({
                    id: 'confirmDirectoryDialog',
                })}
                contentText={intl.formatMessage({
                    id: 'moveItemContentText',
                })}
            />
        </div>
    );
};

DirectorySelect.propTypes = {};

export default DirectorySelect;
