import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { deleteElement } from '../../utils/rest-api';
import DeleteIcon from '@material-ui/icons/Delete';

import DeleteDialog from '../dialogs/delete-dialog';
import CommonToolbar from './common-toolbar';

const DialogsId = {
    DELETE: 'delete',
    NONE: 'none',
};

const ContentToolbar = (props) => {
    const { selectedElements, ...others } = props;
    const userId = useSelector((state) => state.user.profile.sub);
    const intl = useIntl();

    const [openDialog, setOpenDialog] = useState(null);
    const [lastError, setLastError] = React.useState('');
    const [items, setItems] = useState([]);

    const handleOpenDialog = (DialogId) => {
        setOpenDialog(DialogId);
    };

    const handleCloseDialog = () => {
        setOpenDialog(DialogsId.NONE);
        setLastError('');
    };

    const handleClickDeleteElement = () => {
        let notDeleted = [];
        let doneChildren = [];
        for (let child of selectedElements) {
            deleteElement(child.elementUuid).then((response) => {
                doneChildren.push(child);
                if (!response.ok) {
                    notDeleted.push(child.elementName);
                }

                if (doneChildren.length === selectedElements.length) {
                    if (notDeleted.length === 0) {
                        handleCloseDialog();
                    } else {
                        let msg = intl.formatMessage(
                            { id: 'deleteElementsFailure' },
                            {
                                pbn: notDeleted.length,
                                stn: selectedElements.length,
                                problematic: notDeleted.join(' '),
                            }
                        );
                        console.warn(msg);
                        setLastError(msg);
                    }
                }
            });
        }
    };

    // Allowance
    const isUserAllowed = useCallback(() => {
        return selectedElements.every((el) => {
            return el.owner === userId;
        });
    }, [selectedElements, userId]);

    const allowsDelete = useCallback(() => {
        return isUserAllowed();
    }, [isUserAllowed]);

    useEffect(() => {
        // build items here
        let itemsCopy = [];
        if (selectedElements.length === 0 || !allowsDelete()) {
            setItems([]);
            return;
        }

        itemsCopy.push({
            tooltipTextId: 'delete',
            callback: () => {
                handleOpenDialog(DialogsId.DELETE);
            },
            icon: <DeleteIcon fontSize="small" />,
            disabled: selectedElements.length === 0 || !allowsDelete(),
        });

        setItems(itemsCopy);
    }, [allowsDelete, selectedElements]);

    return (
        <>
            <CommonToolbar {...others} items={items} />
            <DeleteDialog
                open={openDialog === DialogsId.DELETE}
                onClose={handleCloseDialog}
                onClick={handleClickDeleteElement}
                items={selectedElements}
                multipleDeleteFormatMessageId={
                    'deleteMultipleItemsDialogMessage'
                }
                simpleDeleteFormatMessageId={'deleteItemDialogMessage'}
                error={lastError}
            />
        </>
    );
};

ContentToolbar.propTypes = {
    selectedElements: PropTypes.array,
};

export default ContentToolbar;
