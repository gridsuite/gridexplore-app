/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { downloadCase, getCaseOriginalName } from '../../utils/rest-api';
import { ElementType } from '../../utils/elementType';
import { useIntl } from 'react-intl';
import { useSnackMessage } from '@gridsuite/commons-ui';

export const downloadCases = async (uuids: string[]) => {
    for (const uuid of uuids) {
        const result = await downloadCase(uuid);
        let name = await getCaseOriginalName(uuid);
        const blob = await result.blob();
        const href = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.setAttribute(
            'download',
            typeof name === 'string' ? name : `${uuid}.xiidm`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export function useDownloadUtils() {
    const intl = useIntl();
    const { snackInfo } = useSnackMessage();

    const handleDownloadCases = async (selectedElements: any[]) => {
        const casesUuids = selectedElements
            .filter((element) => element.type === ElementType.CASE)
            .map((element) => element.elementUuid);
        await downloadCases(casesUuids);
        if (casesUuids.length !== selectedElements.length) {
            let msg = intl.formatMessage(
                { id: 'partialDownloadCasesInfo' },
                {
                    number: selectedElements.length - casesUuids.length,
                }
            );
            snackInfo({
                messageTxt: msg,
            });
        }
    };

    return { handleDownloadCases };
}
