/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import type { GetRowIdParams } from 'ag-grid-community';
import {
    CloseButton,
    CustomAGGrid,
    type ElementAttributes,
    snackWithFallback,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { fetchReferencingElementInfos } from '../../../utils/rest-api';
import type { ReferencingElement } from '../../../utils/referencing-element-infos.type';
import { AGGRID_LOCALES } from '../../../translations/not-intl/aggrid-locales';
import { CustomAggridLocalStateProvider } from '../../custom-aggrid/custom-aggrid-local-state-provider';
import { defaultColumnDefinition, getColumnsDefinition } from './sharing-links-columns';
import type { PathCellRendererContext } from './path-cell-renderer';

const getRowId = (params: GetRowIdParams<ReferencingElement>) => params.data.id;

const isPlainLeftClick = (event: MouseEvent) =>
    event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

export interface SharingLinksDialogProps {
    open: boolean;
    onClose: () => void;
    element: Pick<ElementAttributes, 'elementUuid' | 'elementName'>; // the inspected (shared) element
    onNavigate?: () => void;
}

/**
 * Read-only dialog listing the elements that use a shared element ("sharing links").
 */
export default function SharingLinksDialog({
    open,
    onClose,
    element,
    onNavigate = onClose,
}: Readonly<SharingLinksDialogProps>) {
    const intl = useIntl();
    const { snackError } = useSnackMessage();
    const gridRef = useRef<AgGridReact<ReferencingElement>>(null);

    const [referencingElements, setReferencingElements] = useState<ReferencingElement[]>();

    useEffect(() => {
        fetchReferencingElementInfos(element.elementUuid)
            .then((referencingElementInfos) =>
                setReferencingElements(referencingElementInfos.map((infos) => ({ ...infos, id: crypto.randomUUID() })))
            )
            .catch((error) => {
                console.error(error);
                setReferencingElements([]);
                snackWithFallback(snackError, error, { headerId: 'sharingLinksError' });
            });
    }, [element.elementUuid, snackError]);

    const onLinkClick = useCallback(
        (event: MouseEvent) => {
            if (event.altKey || event.getModifierState('AltGraph')) {
                event.preventDefault();
                window.open(event.currentTarget.getAttribute('href') ?? undefined, '_blank');
            } else if (isPlainLeftClick(event)) {
                onNavigate();
            }
        },
        [onNavigate]
    );

    const context = useMemo<PathCellRendererContext>(() => ({ onLinkClick }), [onLinkClick]);

    const columnDefs = useMemo(() => getColumnsDefinition(intl), [intl]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth aria-labelledby="dialog-title-sharing-links">
            <DialogTitle id="dialog-title-sharing-links" data-testid="DialogTitle">
                <FormattedMessage id="sharingLinksOf" />
                {` ${element.elementName}`}
            </DialogTitle>
            <DialogContent>
                <CustomAggridLocalStateProvider gridRef={gridRef}>
                    <CustomAGGrid
                        ref={gridRef}
                        rowData={referencingElements}
                        getRowId={getRowId}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColumnDefinition}
                        context={context}
                        loading={referencingElements === undefined}
                        overrideLocales={AGGRID_LOCALES}
                        domLayout="autoHeight"
                    />
                </CustomAggridLocalStateProvider>
            </DialogContent>
            <DialogActions>
                <CloseButton onClick={onClose} />
            </DialogActions>
        </Dialog>
    );
}
