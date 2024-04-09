/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { FormattedMessage, useIntl } from 'react-intl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { Checkbox, DialogContentText, Divider, FormGroup } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useSnackMessage } from '@gridsuite/commons-ui';
import { deleteElements, restoreElements } from '../../../utils/rest-api';
import { IDirectory } from '../../../redux/reducer.type';
import PopupConfirmationDialog from '../../utils/popup-confirmation-dialog';
import Alert from '@mui/material/Alert';
import { StashedElementListItem } from './stashed-elements-list-item';
import { StashedElement } from './stashed-elements.type';

interface IStashedElementsDialog {
    open: boolean;
    onClose: () => void;
    stashedElements: StashedElement[];
    onStashedElementChange: () => any[];
    directoryToRestore: IDirectory;
}

function getElementId(element: StashedElement) {
    return element.first.elementUuid;
}

const StashedElementsDialog = ({
    open,
    onClose,
    onStashedElementChange,
    stashedElements,
    directoryToRestore,
}: IStashedElementsDialog) => {
    const intl = useIntl();
    const [selectedElements, setSelectedElements] = useState<string[]>([]);
    const [openConfirmationPopup, setOpenConfirmationPopup] =
        useState<boolean>(false);
    const { snackError } = useSnackMessage();

    const [error, setError] = useState('');

    const handleSelectAll = useCallback(() => {
        setSelectedElements((values) =>
            values.length === stashedElements.length
                ? []
                : stashedElements.map(getElementId)
        );
    }, [stashedElements]);

    const handleCheckBoxChange = useCallback((elementId: string) => {
        setSelectedElements((values) =>
            values.includes(elementId)
                ? values.filter((id) => id !== elementId)
                : [...values, elementId]
        );
    }, []);

    const handleDelete = useCallback(() => {
        deleteElements(selectedElements, directoryToRestore.elementUuid)
            .then(onStashedElementChange)
            .catch((error) => {
                if (error.status === 403) {
                    const errorMsg = intl.formatMessage(
                        { id: 'DeleteElementFromStashError' },
                        { multiselect: selectedElements.length > 1 }
                    );

                    snackError({
                        messageTxt: errorMsg,
                    });
                } else {
                    snackError({
                        messageTxt: error.message,
                    });
                }
            })
            .finally(onClose);
    }, [
        selectedElements,
        snackError,
        directoryToRestore,
        onStashedElementChange,
        onClose,
        intl,
    ]);

    const handleRestore = useCallback(() => {
        if (directoryToRestore?.elementUuid) {
            restoreElements(selectedElements, directoryToRestore.elementUuid)
                .then(onStashedElementChange)
                .catch((error) => {
                    if (error.status === 403) {
                        const errorMessage = directoryToRestore.accessRights
                            .isPrivate
                            ? 'RestoreElementsInPrivateDirectoryError'
                            : 'RestoreElementsInPublicDirectoryError';
                        snackError({
                            messageTxt: intl.formatMessage({
                                id: errorMessage,
                            }),
                        });
                    } else {
                        snackError({
                            messageTxt: error.message,
                        });
                    }
                })
                .finally(onClose);
        } else {
            setError('NoDirectorySelectedError');
        }
    }, [
        selectedElements,
        snackError,
        directoryToRestore,
        onStashedElementChange,
        onClose,
        intl,
    ]);

    const noSelectedElements = selectedElements.length === 0;

    const elementsField = stashedElements.map((element) => {
        const elementId = element.first.elementUuid;
        return (
            <StashedElementListItem
                stashedElement={element}
                handleCheckBoxChange={handleCheckBoxChange}
                isSelected={selectedElements.includes(elementId)}
                key={elementId}
            />
        );
    });

    return (
        <>
            <Dialog open={open}>
                <DialogTitle>
                    {intl.formatMessage({
                        id: 'RecycleBin',
                    })}
                    <DialogContentText>
                        <FormattedMessage id="RecybleBin.autodeletionWarning" />
                    </DialogContentText>
                    <DialogActions>
                        <Button
                            size="small"
                            onClick={() => setOpenConfirmationPopup(true)}
                            disabled={noSelectedElements}
                        >
                            <FormattedMessage id="DeleteRows" />
                        </Button>
                        <Button
                            size="small"
                            onClick={handleRestore}
                            disabled={noSelectedElements}
                            variant="outlined"
                        >
                            <FormattedMessage id="restore" />
                        </Button>
                    </DialogActions>
                    <Divider sx={{ opacity: 1 }} />
                </DialogTitle>

                <DialogContent>
                    <FormControl fullWidth>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={
                                        selectedElements.length ===
                                        stashedElements.length
                                    }
                                    onChange={handleSelectAll}
                                />
                            }
                            label={intl.formatMessage({ id: 'All' })}
                        />
                        <FormGroup>{elementsField}</FormGroup>
                    </FormControl>
                    {error && (
                        <Alert severity={'error'}>
                            <FormattedMessage id={error} />
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} variant="outlined">
                        <FormattedMessage id="close" />
                    </Button>
                </DialogActions>
            </Dialog>
            <PopupConfirmationDialog
                openConfirmationPopup={openConfirmationPopup}
                message={'ElementsWillBeDeletedMsg'}
                handlePopupConfirmation={handleDelete}
                setOpenConfirmationPopup={setOpenConfirmationPopup}
                validateButtonLabel={'DeleteRows'}
            />
        </>
    );
};

export default StashedElementsDialog;
