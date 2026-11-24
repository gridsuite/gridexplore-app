/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ElementAttributes } from '@gridsuite/commons-ui';

/**
 * One element using a shared element, as returned by the explore-server.
 * There is one entry per reference, so a same element appears once per node referencing it.
 */
export type ReferencingElementInfos = Pick<
    ElementAttributes,
    'elementUuid' | 'elementName' | 'type' | 'ownerLabel' | 'lastModificationDate' | 'lastModifiedByLabel'
> & {
    path: Pick<ElementAttributes, 'elementUuid' | 'elementName'>[]; // parent directories, from the root
    node?: string; // study node carrying the modification, only relevant for in-study sharing
};

/**
 * A row of the sharing links table. Two rows can be strictly identical when a same node references
 * the shared element twice, hence the generated id.
 */
export type ReferencingElement = ReferencingElementInfos & { id: string };
