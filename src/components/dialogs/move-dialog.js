import React from 'react';
import PropTypes from 'prop-types';
import { elementType } from '@gridsuite/commons-ui';
import DirectorySelector from './directory-selector';
import { useIntl } from 'react-intl';

const MoveDialog = ({ open, onClose, items }) => {
    const intl = useIntl();

    //TODO : change nbElement
    return (
        <>
            <DirectorySelector
                types={elementType.DIRECTORY}
                open={open}
                onClose={onClose}
                title={intl.formatMessage({ id: 'moveItemTitle' })}
                validationButtonText={intl.formatMessage(
                    {
                        id: 'moveItemValidate',
                    },
                    {
                        nbElements: items.length,
                    }
                )}
                contentText={intl.formatMessage({ id: 'moveItemContentText' })}
            />
        </>
    );
};

MoveDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    items: PropTypes.array.isRequired,
};

export default MoveDialog;
