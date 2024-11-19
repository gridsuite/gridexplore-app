/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
} from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import { CancelButton, ElementAttributes, OverflowableText } from '@gridsuite/commons-ui';

export interface DeleteDialogProps {
    open: boolean;
    onClose: () => void;
    onClick: () => void;
    items: ElementAttributes[];
    multipleDeleteFormatMessageId: string;
    simpleDeleteFormatMessageId: string;
    error: string;
}

const styles = {
    tooltip: {
        maxWidth: '1000px',
    },
};

/**
 * Dialog to delete an element
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 * @param {EventListener} onClick Event to submit the deletion
 * @param {Array} items Items for deletion confirmation
 * @param {String} multipleDeleteFormatMessageId Format message id for multiple delete
 * @param {String} simpleDeleteFormatMessageId Format message id for simple delete
 * @param {String} error Error message
 */
export default function DeleteDialog({
    open,
    onClose,
    onClick,
    items,
    multipleDeleteFormatMessageId,
    simpleDeleteFormatMessageId,
    error,
}: Readonly<DeleteDialogProps>) {
    const intl = useIntl();

    const [itemsState, setItemsState] = useState<ElementAttributes[]>([]);

    const [loadingState, setLoadingState] = useState(false);

    const openRef = useRef<boolean | null>(null);

    useEffect(() => {
        if ((open && !openRef.current) || error !== '') {
            setItemsState(items);
            setLoadingState(false);
        }
        openRef.current = open;
    }, [open, items, error]);

    const handleClose = (_: SyntheticEvent, reason?: string) => {
        if (reason === 'backdropClick') {
            return;
        }
        onClose();
    };

    const handleClick = () => {
        console.debug('Request for deletion');
        setLoadingState(true);
        onClick();
    };

    const buildTitle = () => intl.formatMessage({ id: 'deleteDialogTitle' });

    const renderElement = (renderItems: ElementAttributes[]) => {
        const isBig = renderItems[0].elementName?.length > 72;

        const style = isBig
            ? { width: '100%', fontWeight: 'bold' }
            : {
                  fontWeight: 'bold',
                  marginLeft: 'initial',
                  marginRight: 'initial',
                  verticalAlign: 'middle',
                  display: 'inline-block',
              };
        return <OverflowableText text={renderItems[0].elementName} style={style} tooltipSx={styles.tooltip} />;
    };

    const buildItemsToDeleteGrid = (
        gridItems: ElementAttributes[],
        gridMultipleDeleteFormatMessageId: string,
        gridSimpleDeleteFormatMessageId: string
    ) =>
        gridItems &&
        (gridItems.length > 1 ? (
            <Grid>
                <Grid item>
                    <span>
                        {intl.formatMessage({
                            id: gridMultipleDeleteFormatMessageId,
                        })}
                    </span>
                </Grid>
            </Grid>
        ) : (
            <Grid>
                <Grid item>
                    <span>
                        {intl.formatMessage(
                            {
                                id: gridSimpleDeleteFormatMessageId,
                            },
                            {
                                itemName: <span>{gridItems.length === 1 && renderElement(gridItems)}</span>,
                            }
                        )}
                    </span>
                </Grid>
            </Grid>
        ));

    return (
        <Dialog open={open} onClose={handleClose} aria-labelledby="dialog-title-delete">
            <DialogTitle style={{ display: 'flex' }}>{buildTitle()}</DialogTitle>
            <DialogContent>
                {buildItemsToDeleteGrid(itemsState, multipleDeleteFormatMessageId, simpleDeleteFormatMessageId)}
                {error !== '' && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <CancelButton onClick={handleClose} disabled={loadingState} />
                <Button onClick={handleClick} variant="outlined" disabled={loadingState}>
                    {(loadingState && <CircularProgress size={24} />) || <FormattedMessage id="delete" />}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
