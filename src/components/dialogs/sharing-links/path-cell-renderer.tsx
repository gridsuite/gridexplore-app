/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { MouseEventHandler } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';
import type { ReferencingElement } from '../../../utils/referencing-element-infos.type';
import PathBreadcrumbs from './path-breadcrumbs';

export type PathCellRendererContext = {
    onLinkClick: MouseEventHandler;
};

export function PathCellRenderer({
    data,
    context,
}: Readonly<ICellRendererParams<ReferencingElement, string, PathCellRendererContext>>) {
    return data ? <PathBreadcrumbs path={data.path} onLinkClick={context.onLinkClick} /> : null;
}
