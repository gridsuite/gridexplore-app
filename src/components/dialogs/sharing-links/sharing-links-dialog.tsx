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
import { useState } from 'react';
import type { UUID } from 'node:crypto';
import { type ElementAttributes, ElementType } from '@gridsuite/commons-ui';
import { UserCellRenderer } from '../../utils/renderers/user-cell-renderer';
import { DateCellRenderer } from '../../utils/renderers/date-cell-renderer';
import { getElementTypeTranslation } from '../../utils/translation-utils';

/**
 * One element using the inspected shared element (e.g. a study referencing a shared
 * composite modification). Shape anticipated for the future explore-server endpoint.
 */
export interface SharingLink {
    elementUuid: UUID;
    elementName: string;
    type: ElementType;
    subtype?: string | null; // for getElementTypeTranslation (filters, contingency lists…)
    pathName: string[]; // parent directories, rendered "a / b /"
    node?: string; // study node carrying the modification (only relevant for in-study sharing)
    ownerLabel?: string;
    lastModificationDate: string;
    lastModifiedByLabel?: string;
}

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

    // TODO(GRD-4774): replace with an explore-server call fetchElementSharingLinks(element.elementUuid)
    const [links] = useState<SharingLink[]>([]);

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
                        {links.map((link) => (
                            <TableRow key={link.elementUuid}>
                                <TableCell>{link.elementName}</TableCell>
                                <TableCell>
                                    {getElementTypeTranslation(link.type, link.subtype ?? null, null, intl)}
                                </TableCell>
                                <TableCell>{link.pathName.join(' / ')}</TableCell>
                                <TableCell>{link.node}</TableCell>
                                <TableCell>
                                    <UserCellRenderer value={link.ownerLabel ?? ''} />
                                </TableCell>
                                <TableCell>
                                    <DateCellRenderer value={link.lastModificationDate} />
                                </TableCell>
                                <TableCell>
                                    <UserCellRenderer value={link.lastModifiedByLabel ?? ''} />
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
