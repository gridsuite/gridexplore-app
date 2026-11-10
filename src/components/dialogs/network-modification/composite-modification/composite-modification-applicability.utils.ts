/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { NetworkModificationMetadata } from '@gridsuite/commons-ui';

// What surrounds the table in the dialog: paddings of the content, margins and border of the table, vertical scrollbar
const TABLE_SURROUNDINGS_WIDTH = 82;
// Beyond its minimum size, so that the names of the nested modifications stay readable when the dialog can grow
const NAME_COLUMN_EXTRA_WIDTH = 160;
// The default margins of a MUI dialog
const DIALOG_MARGINS_WIDTH = 64;

/**
 * The dialog takes 75% of the screen, and more when its columns need it, as far as the screen allows. On a screen too
 * small for them, the table scrolls horizontally.
 * @param tableMinWidth the sum of the minimum sizes of the columns
 * @return the CSS width of the dialog
 */
export function computeDialogWidth(tableMinWidth: number) {
    const neededWidth = tableMinWidth + NAME_COLUMN_EXTRA_WIDTH + TABLE_SURROUNDINGS_WIDTH;
    return `min(calc(100vw - ${DIALOG_MARGINS_WIDTH}px), max(75vw, ${neededWidth}px))`;
}

/**
 * GridExplore has no study, hence no list of root networks: the only ones it knows of are the tags the modifications
 * hold an applicability for, in the whole tree since a shared modification may come with tags of its own, and those of
 * the studies using the modification.
 * @param extraTags the tags known from elsewhere than the modifications
 * @return these tags, sorted
 */
export function collectRootNetworkTags(
    modifications: NetworkModificationMetadata[],
    extraTags: string[] = []
): string[] {
    const tags = new Set<string>(extraTags);
    const collect = (modification: NetworkModificationMetadata) => {
        Object.keys(modification.applicabilityByRootNetworkTag ?? {}).forEach((tag) => tags.add(tag));
        modification.modificationsInfos?.forEach(collect);
        if (modification.referencedInfos) {
            collect(modification.referencedInfos);
        }
    };
    modifications.forEach(collect);
    return [...tags].sort((tag1, tag2) => tag1.localeCompare(tag2));
}
