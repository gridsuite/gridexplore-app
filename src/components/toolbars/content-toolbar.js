import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { deleteElement, moveElementToDirectory } from '../../utils/rest-api';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';

import DeleteDialog from '../dialogs/delete-dialog';
import CommonToolbar from './common-toolbar';

import { useMultipleDeferredFetch } from '../../utils/custom-hooks';
import { useSnackbar } from 'notistack';
import MoveDialog from '../dialogs/move-dialog';
import { ElementType } from '../../utils/elementType';

const DialogsId = {
    DELETE: 'delete',
    MOVE: 'move',
    NONE: 'none',
};

const ContentToolbar = (props) => {
    const { selectedElements, ...others } = props;
    const userId = useSelector((state) => state.user.profile.sub);
    const { enqueueSnackbar } = useSnackbar();
    const intl = useIntl();

    const [openDialog, setOpenDialog] = useState(null);
    const [items, setItems] = useState([]);

    const handleLastError = useCallback(
        (message) => {
            enqueueSnackbar(message, {
                variant: 'error',
            });
        },
        [enqueueSnackbar]
    );

    const handleOpenDialog = (DialogId) => {
        setOpenDialog(DialogId);
    };

    const handleCloseDialog = useCallback(() => {
        setOpenDialog(DialogsId.NONE);
    }, []);

    const [multipleDeleteError, setMultipleDeleteError] = useState('');
    const deleteElementOnError = useCallback(
        (errorMessages, params, paramsOnErrors) => {
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
        [intl]
    );
    const [deleteCB] = useMultipleDeferredFetch(
        deleteElement,
        handleCloseDialog,
        undefined,
        deleteElementOnError,
        false
    );

    const moveElementErrorToString = useCallback(
        (HTTPStatusCode) => {
            if (HTTPStatusCode === 403) {
                return intl.formatMessage({
                    id: 'moveElementNotAllowedError',
                });
            } else if (HTTPStatusCode === 404) {
                return intl.formatMessage({ id: 'moveElementNotFoundError' });
            }
        },
        [intl]
    );

    const moveElementOnError = useCallback(
        (errorMessages, params, paramsOnErrors) => {
            let msg = intl.formatMessage(
                { id: 'moveElementsFailure' },
                {
                    pbn: errorMessages.length,
                    stn: paramsOnErrors.length,
                    problematic: paramsOnErrors.map((p) => p[0]).join(' '),
                }
            );
            console.debug(msg);
            handleLastError(msg);
        },
        [handleLastError, intl]
    );

    const [moveCB] = useMultipleDeferredFetch(
        moveElementToDirectory,
        undefined,
        moveElementErrorToString,
        moveElementOnError,
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

    const allowsMove = useCallback(() => {
        return (
            selectedElements.every(
                (element) => element.type !== ElementType.DIRECTORY
            ) && isUserAllowed()
        );
    }, [isUserAllowed, selectedElements]);

    useEffect(() => {
        // build items here
        let itemsCopy = [];
        if (
            selectedElements.length === 0 ||
            (!allowsDelete() && !allowsMove())
        ) {
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

        itemsCopy.push({
            tooltipTextId: 'move',
            callback: () => {
                handleOpenDialog(DialogsId.MOVE);
            },
            icon: <DriveFileMoveIcon fontSize="small" />,
            disabled: selectedElements.length === 0 || !allowsMove(),
        });

        setItems(itemsCopy);
    }, [allowsMove, allowsDelete, selectedElements]);

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
            <MoveDialog
                open={openDialog === DialogsId.MOVE}
                onClose={(selectedDir) => {
                    if (selectedDir.length > 0) {
                        moveCB(
                            selectedElements.map((element) => {
                                return [element.elementUuid, selectedDir[0].id];
                            })
                        );
                    }
                    handleCloseDialog();
                }}
                items={selectedElements}
            />
        </>
    );
};

ContentToolbar.propTypes = {
    selectedElements: PropTypes.array,
};

export default ContentToolbar;
