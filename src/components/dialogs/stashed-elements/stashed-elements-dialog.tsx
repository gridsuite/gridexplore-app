/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FunctionComponent, useCallback, useState } from 'react';
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

interface IStashedElementsDialog {
    open: boolean;
    titleId: string;
    elements: any[];
    getOptionLabel: (element: any) => string;
    getElementId: (element: any) => string;
    onDelete: (elements: string[]) => void;
    onRestore: (elements: string[]) => void;
    onClose: () => void;
}

const StashedElementsDialog: FunctionComponent<IStashedElementsDialog> = ({
    open,
    titleId,
    elements,
    getOptionLabel,
    getElementId,
    onDelete,
    onRestore,
    onClose,
}) => {
    const intl = useIntl();
    const [selectedElements, setSelectedElements] = useState<string[]>([]);

    const handleSelectAll = useCallback(() => {
        if (selectedElements.length === elements.length) {
            setSelectedElements([]);
        } else {
            setSelectedElements(elements.map((e) => getElementId(e)));
        }
    }, []);

    const handleCheckBoxChange = useCallback((elementId: string) => {
        setSelectedElements((values) =>
            values.includes(elementId)
                ? values.filter((id) => id !== elementId)
                : [...values, elementId]
        );
    }, []);

    const handleDelete = useCallback(() => {
        console.log('selectedElements : ', selectedElements)
        onDelete(selectedElements);
    }, []);

    const handleRestore = useCallback(() => {
        console.log('selectedElements : ', selectedElements)
        onRestore(selectedElements);
    }, []);

    const noSelectedElements = selectedElements.length === 0;

    const selectAllCheckBoxField = (
        <Box>
            <Checkbox
                color={'primary'}
                edge="start"
                checked={selectedElements.length === elements.length}
                onClick={handleSelectAll}
                disableRipple
                value={'Select all'}
                name={'Select all'}
            />
        </Box>
    );

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
                    id: titleId,
                })}
            </DialogTitle>
            <DialogContent>
                <FormControl>
                    <FormGroup>
                        <Box>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedElements.length === elements.length}
                                        onChange={handleSelectAll}
                                    />
                                }
                                label={'Select all'}
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
