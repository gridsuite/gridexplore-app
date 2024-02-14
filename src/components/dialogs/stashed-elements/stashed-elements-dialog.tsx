/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { FormattedMessage, useIntl } from 'react-intl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { Checkbox, FormGroup } from '@mui/material';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useSnackMessage } from '@gridsuite/commons-ui';
import {
    deleteElements,
    getStashedElements,
    restoreElements,
} from '../../../utils/rest-api';
import { useSelector } from 'react-redux';
import { ReduxState } from '../../../redux/reducer.type';

interface IStashedElementsDialog {
    open: boolean;
    onClose: () => void;
}

function getOptionLabel(element: any) {
    return element.second
        ? element.first.elementName + ' (' + element.second + ')'
        : element.first.elementName;
}

function getElementId(element: any) {
    return element.first.elementUuid;
}

const StashedElementsDialog: FunctionComponent<IStashedElementsDialog> = ({
    open,
    onClose,
}) => {
    const intl = useIntl();
    const [selectedElements, setSelectedElements] = useState<string[]>([]);
    const [elements, setElements] = useState<any[]>([]);
    const { snackError } = useSnackMessage();
    const activeDirectory = useSelector(
        (state: ReduxState) => state.activeDirectory
    );

    const handleGetStashedElement = useCallback(() => {
        getStashedElements()
            .then((response: any[]) => {
                setElements(response);
            })
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                });
            });
    }, [snackError]);

    useEffect(() => {
        if (open) {
            handleGetStashedElement();
        }
    }, [open]);

    const handleSelectAll = useCallback(() => {
        setSelectedElements((values) =>
            values.length === elements.length
                ? []
                : elements.map((e) => getElementId(e))
        );
    }, [elements]);

    const handleCheckBoxChange = useCallback((elementId: string) => {
        setSelectedElements((values) =>
            values.includes(elementId)
                ? values.filter((id) => id !== elementId)
                : [...values, elementId]
        );
    }, []);

    const handleDelete = useCallback(() => {
        deleteElements(selectedElements, activeDirectory)
            .then(() => handleGetStashedElement())
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                });
            });
    }, [selectedElements, snackError, activeDirectory]);

    const handleRestore = useCallback(() => {
        restoreElements(selectedElements, activeDirectory, false)
            .then(() => handleGetStashedElement())
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                });
            });
    }, [selectedElements, snackError, activeDirectory]);

    const noSelectedElements = selectedElements.length === 0;

    const elementsField = elements.map((element) => {
        const elementId = getElementId(element);
        return (
            <FormControlLabel
                key={elementId}
                control={
                    <Checkbox
                        checked={selectedElements.includes(elementId)}
                        onChange={() => handleCheckBoxChange(elementId)}
                    />
                }
                label={getOptionLabel(element)}
            />
        );
    });

    return (
        <Dialog open={open}>
            <DialogTitle>
                {intl.formatMessage({
                    id: 'StashedElements',
                })}
            </DialogTitle>
            <DialogContent>
                <FormControl>
                    <FormGroup>
                        <Box>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={
                                            selectedElements.length ===
                                            elements.length
                                        }
                                        onChange={handleSelectAll}
                                    />
                                }
                                label={intl.formatMessage({ id: 'All' })}
                            />
                        </Box>
                        {elementsField}
                    </FormGroup>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    <FormattedMessage id="close" />
                </Button>
                <Button onClick={handleDelete} disabled={noSelectedElements}>
                    <FormattedMessage id="DeleteRows" />
                </Button>
                <Button
                    onClick={handleRestore}
                    disabled={noSelectedElements}
                    variant="outlined"
                >
                    <FormattedMessage id="restore" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StashedElementsDialog;
