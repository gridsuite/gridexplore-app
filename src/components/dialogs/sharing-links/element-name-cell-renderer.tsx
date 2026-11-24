/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Link } from '@mui/material';
import type { ICellRendererParams } from 'ag-grid-community';
import { ElementType } from '@gridsuite/commons-ui';
import type { ReferencingElement } from '../../../utils/referencing-element-infos.type';
import { useStudyUrl } from '../../../hooks/use-study-url';

/**
 * The name of a referencing element, as a link opening it in a new tab when it is a study.
 */
export function ElementNameCellRenderer({ data, value }: Readonly<ICellRendererParams<ReferencingElement, string>>) {
    const getStudyUrl = useStudyUrl();
    const studyUrl = data?.type === ElementType.STUDY ? getStudyUrl(data.elementUuid) : null;
    return studyUrl ? (
        <Link href={studyUrl} target="_blank" rel="noopener noreferrer" underline="hover" noWrap>
            {value}
        </Link>
    ) : (
        value
    );
}
