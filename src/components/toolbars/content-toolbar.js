import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { deleteElement } from '../../utils/rest-api';
import DeleteIcon from '@material-ui/icons/Delete';

import DeleteDialog from '../dialogs/delete-dialog';
import CommonToolbar from './common-toolbar';

import { useMultipleDeferredFetch } from '../../utils/custom-hooks';

const DialogsId = {
    DELETE: 'delete',
    NONE: 'none',
};

const ContentToolbar = (props) => {
    const { selectedElements, ...others } = props;
    const userId = useSelector((state) => state.user.profile.sub);
    const intl = useIntl();

    const [openDialog, setOpenDialog] = useState(null);
    const [items, setItems] = useState([]);

    const handleOpenDialog = (DialogId) => {
        setOpenDialog(DialogId);
    };

    const handleCloseDialog = () => {
        setOpenDialog(DialogsId.NONE);
    };

    const [multipleDeleteError, setMultipleDeleteError] = useState('');
    const [deleteCB] = useMultipleDeferredFetch(
        deleteElement,
        handleCloseDialog,
        undefined,
        (errorMessages, paramsOnErrors, params) => {
            let msg = intl.formatMessage(
                { id: 'deleteElementsFailure' },
                {
                    pbn: errorMessages.length,
                    stn: params.length,
                    problematic: paramsOnErrors
                        .map((p) => p.elementUuid)
                        .join(' '),
                }
            );
            console.debug(msg);
            setMultipleDeleteError(msg);
        },
        false
    );

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
                onClick={() =>
                    deleteCB(
                        selectedElements.map((e) => {
                            return [e.elementUuid];
                        })
                    )
                }
                items={selectedElements}
                multipleDeleteFormatMessageId={
                    'deleteMultipleItemsDialogMessage'
                }
                simpleDeleteFormatMessageId={'deleteItemDialogMessage'}
                error={multipleDeleteError}
            />
        </>
    );
};

ContentToolbar.propTypes = {
    selectedElements: PropTypes.array,
};

export default ContentToolbar;
