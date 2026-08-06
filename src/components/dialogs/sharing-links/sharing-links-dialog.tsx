/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
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
import { CloseButton, type ElementAttributes, snackWithFallback, useSnackMessage } from '@gridsuite/commons-ui';
import { UserAvatarWithLabel } from '../../utils/renderers/user-avatar';
import { DateCellRenderer } from '../../utils/renderers/date-cell-renderer';
import { getElementTypeTranslation } from '../../utils/translation-utils';
import { fetchReferencingElementInfos } from '../../../utils/rest-api';
import { ReferencingElementInfos } from '../../../utils/referencing-element-infos.type';
import PathBreadcrumbs from './path-breadcrumbs';

/**
 * An element using the shared element. It carries no identifier of its own: there is one row per
 * reference, so two rows can be strictly identical when a same node references the shared element
 * twice. Hence the generated id.
 */
type ReferencingElement = ReferencingElementInfos & { id: string };

export interface SharingLinksDialogProps {
    open: boolean;
    onClose: () => void;
    element: ElementAttributes; // the inspected (shared) element
}

/**
 * Read-only dialog listing the elements that use a shared element ("sharing links").
 */
export default function SharingLinksDialog({ open, onClose, element }: Readonly<SharingLinksDialogProps>) {
    const intl = useIntl();
    const { snackError } = useSnackMessage();

    const [referencingElements, setReferencingElements] = useState<ReferencingElement[]>([]);

    useEffect(() => {
        fetchReferencingElementInfos(element.elementUuid)
            .then((referencingElementInfos) =>
                setReferencingElements(referencingElementInfos.map((infos) => ({ ...infos, id: crypto.randomUUID() })))
            )
            .catch((error) => {
                console.error(error);
                snackWithFallback(snackError, error, { headerId: 'sharingLinksError' });
            });
    }, [element.elementUuid, snackError]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth aria-labelledby="dialog-title-sharing-links">
            <DialogTitle id="dialog-title-sharing-links" data-testid="DialogTitle">
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
                        {referencingElements.map((referencingElement) => (
                            <TableRow key={referencingElement.id}>
                                <TableCell>{referencingElement.elementName}</TableCell>
                                <TableCell>
                                    {getElementTypeTranslation(referencingElement.type, null, null, intl)}
                                </TableCell>
                                <TableCell>
                                    <PathBreadcrumbs path={referencingElement.path} />
                                </TableCell>
                                <TableCell>{referencingElement.node}</TableCell>
                                <TableCell>
                                    <UserAvatarWithLabel label={referencingElement.ownerLabel ?? ''} />
                                </TableCell>
                                <TableCell>
                                    <DateCellRenderer value={referencingElement.lastModificationDate} />
                                </TableCell>
                                <TableCell>
                                    <UserAvatarWithLabel label={referencingElement.lastModifiedByLabel ?? ''} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DialogContent>
            <DialogActions>
                <CloseButton onClick={onClose} />
            </DialogActions>
        </Dialog>
    );
}
