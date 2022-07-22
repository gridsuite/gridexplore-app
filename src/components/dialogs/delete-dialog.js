/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import Grid from '@mui/material/Grid';
import { Tooltip } from '@mui/material';
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

const DeleteDialog = ({
    open,
    onClose,
    onClick,
    items,
    multipleDeleteFormatMessageId,
    simpleDeleteFormatMessageId,
    error,
}) => {
    const intl = useIntl();

    const [itemsState, setItemState] = useState([]);

    const openRef = useRef(null);

    useEffect(() => {
        if (open && !openRef.current) {
            setItemState(items);
        }
        openRef.current = open;
    }, [open, items]);

    const handleClose = () => {
        onClose();
    };

    const handleClick = () => {
        console.debug('Request for deletion');
        onClick();
    };

    const handleKeyPressed = (event) => {
        if (open && event.key === 'Enter') {
            handleClose();
        }
    };

    const buildTitle = (items) => {
        return items.length === 1
            ? intl.formatMessage(
                  { id: 'deleteItemDialogTitle' },
                  {
                      itemName: elementName(),
                  }
              )
            : intl.formatMessage(
                  { id: 'deleteMultipleItemsDialogTitle' },
                  { itemsCount: items.length }
              );
    };
    function elementName() {
        return (
            <Tooltip title={items[0].elementName}>
                <div
                    style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {items[0].elementName}
                </div>
            </Tooltip>
        );
    }

    const buildItemsToDeleteGrid = (
        items,
        multipleDeleteFormatMessageId,
        simpleDeleteFormatMessageId
    ) => {
        return (
            items &&
            (items.length > 1 ? (
                <Grid>
                    <Grid item>
                        <span>
                            {intl.formatMessage(
                                {
                                    id: multipleDeleteFormatMessageId,
                                },
                                { itemsCount: items.length }
                            )}
                        </span>
                    </Grid>
                    {items.slice(0, 10).map((file) => (
                        <Grid item key={file.elementUuid}>
                            <span>
                                {' '}
                                {
                                    <div
                                        style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {
                                            <Tooltip title={file.elementName}>
                                                <div
                                                    style={{
                                                        overflow: 'hidden',
                                                        textOverflow:
                                                            'ellipsis',
                                                    }}
                                                >
                                                    {file.elementName}
                                                </div>
                                            </Tooltip>
                                        }
                                    </div>
                                }{' '}
                            </span>
                        </Grid>
                    ))}
                    {items.length > 10 && (
                        <Grid item>
                            <span>
                                {intl.formatMessage(
                                    {
                                        id: 'additionalItems',
                                    },
                                    { itemsCount: items.length - 10 }
                                )}
                            </span>
                        </Grid>
                    )}
                </Grid>
            ) : (
                <Grid>
                    <Grid item>
                        <span>
                            {intl.formatMessage(
                                {
                                    id: simpleDeleteFormatMessageId,
                                },
                                {
                                    itemName: (
                                        <span style={{ fontWeight: 'bold' }}>
                                            {items.length === 1 &&
                                                elementName()}
                                        </span>
                                    ),
                                }
                            )}
                        </span>
                    </Grid>
                </Grid>
            ))
        );
    };
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-delete"
            onKeyPress={handleKeyPressed}
        >
            <DialogTitle>{buildTitle(itemsState)}</DialogTitle>
            <DialogContent>
                {buildItemsToDeleteGrid(
                    itemsState,
                    multipleDeleteFormatMessageId,
                    simpleDeleteFormatMessageId
                )}
                {error !== '' && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} variant="outlined">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button onClick={handleClick}>
                    <FormattedMessage id="delete" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DeleteDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    items: PropTypes.array.isRequired,
    multipleDeleteFormatMessageId: PropTypes.string.isRequired,
    simpleDeleteFormatMessageId: PropTypes.string.isRequired,
    error: PropTypes.string.isRequired,
};

export default DeleteDialog;
