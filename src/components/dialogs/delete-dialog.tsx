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
import { type CSSProperties, type SyntheticEvent, useEffect, useRef, useState } from 'react';
import { CancelButton, type ElementAttributes, type MuiStyles, OverflowableText } from '@gridsuite/commons-ui';

export interface DeleteDialogProps {
    /** Is the dialog open ? */
    open: boolean;
    /** Event to close the dialog */
    onClose: () => void;
    /** Event to submit the deletion */
    onClick: () => void;
    /** Items for deletion confirmation */
    items: ElementAttributes[];
    /** Format message id for multiple delete */
    multipleDeleteFormatMessageId: string;
    /** Format message id for simple delete */
    simpleDeleteFormatMessageId: string;
    /** Error message */
    error: string;
}

const styles = {
    tooltip: {
        maxWidth: '1000px',
    },
} as const satisfies MuiStyles;

const rawStyles = {
    bigText: { width: '100%', fontWeight: 'bold' },
    notBigText: {
        fontWeight: 'bold',
        marginLeft: 'initial',
        marginRight: 'initial',
        verticalAlign: 'middle',
        display: 'inline-block',
    },
} as const satisfies Record<string, CSSProperties>;

/**
 * Dialog to delete an element
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
        const style = renderItems[0].elementName?.length > 72 ? rawStyles.bigText : rawStyles.notBigText;
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
