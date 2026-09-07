/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
} from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { type CSSProperties, type SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
    CancelButton,
    type ElementAttributes,
    ElementType,
    fetchDirectoryContent,
    type MuiStyles,
    OverflowableText,
    snackWithFallback,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { getSharingLinksCount, isElementShared } from '../../utils/element-utils';

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
    sharedItemsList: {
        listStyleType: 'disc',
        marginTop: 0.5,
        paddingLeft: 3,
    },
    sharedItem: {
        display: 'list-item',
    },
} as const satisfies MuiStyles;

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
    const { snackError, snackWarning } = useSnackMessage();

    const [itemsState, setItemsState] = useState<ElementAttributes[]>([]);

    const [loadingState, setLoadingState] = useState(false);

    // shared elements held by the directory to delete
    const [sharedDescendants, setSharedDescendants] = useState<ElementAttributes[]>([]);

    const [loadingSharedDescendants, setLoadingSharedDescendants] = useState(false);

    const openRef = useRef<boolean | null>(null);

    // The shared elements that will be included in the deletion
    const sharedItems = useMemo(
        () => [...itemsState.filter(isElementShared), ...sharedDescendants],
        [itemsState, sharedDescendants]
    );

    // directories are only deleted one at a time, from the tree
    const directoryToDeleteUuid = itemsState.find((item) => item.type === ElementType.DIRECTORY)?.elementUuid;

    useEffect(() => {
        if ((open && !openRef.current) || error !== '') {
            setItemsState(items);
            setLoadingState(false);
        }
        openRef.current = open;
    }, [open, items, error]);

    useEffect(() => {
        if (!open || !directoryToDeleteUuid) {
            setSharedDescendants([]);
            return undefined;
        }
        let cancelled = false;
        setLoadingSharedDescendants(true);
        fetchDirectoryContent(directoryToDeleteUuid, undefined, true)
            .then((directoryContent) => {
                if (!cancelled) {
                    setSharedDescendants(directoryContent.filter(isElementShared));
                }
            })
            .catch((fetchError) => {
                console.error(fetchError);
                snackWithFallback(snackError, fetchError, { headerId: 'sharedDescendantsError' });
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingSharedDescendants(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [open, directoryToDeleteUuid, snackError]);

    const handleClose = (_: SyntheticEvent, reason?: string) => {
        if (reason === 'backdropClick') {
            return;
        }
        onClose();
    };

    const handleClick = () => {
        // TODO remove later when fixed : a shared element cannot be deleted while other elements still reference it
        if (sharedItems.length > 0) {
            snackWarning({ messageId: 'deleteSharedItemsForbidden' });
            return;
        }
        console.debug('Request for deletion');
        setLoadingState(true);
        onClick();
    };

    const renderElement = (renderItems: ElementAttributes[]) => {
        const isBig = renderItems[0].elementName?.length > 72;

        const style = (
            isBig
                ? ({ width: '100%', fontWeight: 'bold' } as const)
                : ({
                      fontWeight: 'bold',
                      marginLeft: 'initial',
                      marginRight: 'initial',
                      verticalAlign: 'middle',
                      display: 'inline-block',
                  } as const)
        ) satisfies CSSProperties;
        return <OverflowableText text={renderItems[0].elementName} style={style} tooltipSx={styles.tooltip} />;
    };

    const buildItemsToDeleteGrid = (
        gridItems: ElementAttributes[],
        gridMultipleDeleteFormatMessageId: string,
        gridSimpleDeleteFormatMessageId: string
    ) =>
        gridItems &&
        (gridItems.length > 1 ? (
            <FormattedMessage tagName="span" id={gridMultipleDeleteFormatMessageId} />
        ) : (
            <FormattedMessage
                tagName="span"
                id={gridSimpleDeleteFormatMessageId}
                values={{ itemName: <span>{gridItems.length === 1 && renderElement(gridItems)}</span> }}
            />
        ));

    const buildSharedItems = () => {
        if (sharedItems.length === 0) {
            return false;
        }
        // a single shared element needs no list
        if (
            itemsState.length === 1 &&
            sharedItems.length === 1 &&
            sharedItems[0].elementUuid === itemsState[0].elementUuid
        ) {
            return (
                <Box marginTop={2}>
                    <FormattedMessage
                        id="deleteDialogSharedItemMessage"
                        values={{ count: getSharingLinksCount(sharedItems[0]) }}
                    />
                </Box>
            );
        }
        return (
            <Box marginTop={2}>
                <FormattedMessage id="deleteDialogSharedItemsMessage" />
                <List dense disablePadding sx={styles.sharedItemsList}>
                    {sharedItems.map((item) => (
                        <ListItem key={item.elementUuid} disableGutters disablePadding sx={styles.sharedItem}>
                            <Box display="grid" gridTemplateColumns="minmax(0, 1fr) auto" columnGap={2} width="100%">
                                <OverflowableText text={item.elementName} tooltipSx={styles.tooltip} />
                                <FormattedMessage
                                    id="sharingLinksCount"
                                    values={{ count: getSharingLinksCount(item) }}
                                />
                            </Box>
                        </ListItem>
                    ))}
                </List>
            </Box>
        );
    };

    return (
        <Dialog open={open} onClose={handleClose} aria-labelledby="dialog-title-delete">
            <DialogTitle style={{ display: 'flex' }} data-testid="DialogTitle">
                <FormattedMessage id="deleteDialogTitle" />
            </DialogTitle>
            <DialogContent>
                {buildItemsToDeleteGrid(itemsState, multipleDeleteFormatMessageId, simpleDeleteFormatMessageId)}
                {buildSharedItems()}
                {error !== '' && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <CancelButton onClick={handleClose} disabled={loadingState} data-testid="CancelButton" />
                <Button
                    onClick={handleClick}
                    variant="outlined"
                    disabled={loadingState || loadingSharedDescendants}
                    data-testid="DeleteButton"
                >
                    {(loadingState && <CircularProgress size={24} />) || <FormattedMessage id="delete" />}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
