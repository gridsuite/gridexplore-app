/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import { useEffect, useState } from 'react';
import { type ElementAttributes, snackWithFallback, useSnackMessage } from '@gridsuite/commons-ui';
import { UserAvatarWithLabel } from '../../utils/renderers/user-avatar';
import { DateCellRenderer } from '../../utils/renderers/date-cell-renderer';
import { getElementTypeTranslation } from '../../utils/translation-utils';
import { fetchConsumerElementInfos } from '../../../utils/rest-api';
import { ConsumerElementInfos } from '../../../utils/consumer-element-infos.type';
import PathBreadcrumbs from './path-breadcrumbs';

/**
 * An element using the shared element. It carries no identifier of its own: there is one row per
 * reference, so two rows can be strictly identical when a same node references the shared element
 * twice. Hence the generated id.
 */
type ConsumerElement = ConsumerElementInfos & { id: string };

export interface SharingLinksDialogProps {
    open: boolean;
    onClose: () => void;
    element: ElementAttributes; // the inspected (shared) element
}

/**
 * Read-only dialog listing the elements that use a shared element ("sharing links").
 * Display only: the sole user action is closing the dialog.
 */
export default function SharingLinksDialog({ open, onClose, element }: Readonly<SharingLinksDialogProps>) {
    const intl = useIntl();
    const { snackError } = useSnackMessage();

    const [consumerElements, setConsumerElements] = useState<ConsumerElement[]>([]);

    useEffect(() => {
        fetchConsumerElementInfos(element.elementUuid)
            .then((consumerElementInfos) =>
                setConsumerElements(consumerElementInfos.map((infos) => ({ ...infos, id: crypto.randomUUID() })))
            )
            .catch((error) => {
                console.error(error);
                snackWithFallback(snackError, error, { headerId: 'sharingLinksError' });
            });
    }, [element.elementUuid, snackError]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth aria-labelledby="dialog-title-sharing-links">
            <DialogTitle data-testid="DialogTitle">
                <FormattedMessage id="sharingLinksOf" />
                {` ${element.elementName}`}
            </DialogTitle>
            <DialogContent>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <FormattedMessage id="elementName" />
                            </TableCell>
                            <TableCell>
                                <FormattedMessage id="type" />
                            </TableCell>
                            <TableCell>
                                <FormattedMessage id="path" />
                            </TableCell>
                            <TableCell>
                                <FormattedMessage id="node" />
                            </TableCell>
                            <TableCell>
                                <FormattedMessage id="creator" />
                            </TableCell>
                            <TableCell>
                                <FormattedMessage id="modified" />
                            </TableCell>
                            <TableCell>
                                <FormattedMessage id="modifiedBy" />
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {consumerElements.map((consumerElement) => (
                            <TableRow key={consumerElement.id}>
                                <TableCell>{consumerElement.elementName}</TableCell>
                                <TableCell>
                                    {getElementTypeTranslation(consumerElement.type, null, null, intl)}
                                </TableCell>
                                <TableCell>
                                    <PathBreadcrumbs path={consumerElement.path} />
                                </TableCell>
                                <TableCell>{consumerElement.node}</TableCell>
                                <TableCell>
                                    <UserAvatarWithLabel label={consumerElement.ownerLabel ?? ''} />
                                </TableCell>
                                <TableCell>
                                    <DateCellRenderer value={consumerElement.lastModificationDate} />
                                </TableCell>
                                <TableCell>
                                    <UserAvatarWithLabel label={consumerElement.lastModifiedByLabel ?? ''} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined" data-testid="CloseButton">
                    <FormattedMessage id="close" />
                </Button>
            </DialogActions>
        </Dialog>
    );
}
