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
    const capitalizeFirstLetter = (string: string) =>
        `${string.charAt(0).toUpperCase()}${string.slice(1)}`;

    const buildPartialDownloadMessage = (
        numberOfDownloadedCases: number,
        undownloadableElements: any[]
    ): string => {
        // Building the snackbar message
        let messageFirstLine;
        if (numberOfDownloadedCases === 1) {
            messageFirstLine = intl.formatMessage({
                id: 'download.message.downloadedCase',
            });
        } else {
            messageFirstLine = intl.formatMessage(
                { id: 'download.message.downloadedCases' },
                {
                    number: numberOfDownloadedCases,
                }
            );
        }

        let messageSecondLine;
        let hasOther = false;
        let undownloadableSelectedTypes: string[] = Array.from(
            new Set(
                undownloadableElements
                    .filter((element) => element.type !== ElementType.CASE)
                    .reduce((types, e) => {
                        if (!types.includes(e.type)) {
                            types.push(e.type);
                        }
                        return types;
                    }, [])
                    .map((e: string): string => {
                        switch (e) {
                            case ElementType.FILTER:
                                return intl.formatMessage({
                                    id: 'download.message.filters',
                                });
                            case ElementType.CONTINGENCY_LIST:
                                return intl.formatMessage({
                                    id: 'download.message.lists',
                                });
                            case ElementType.STUDY:
                                return intl.formatMessage({
                                    id: 'download.message.studies',
                                });
                            default:
                                hasOther = true;
                                return intl.formatMessage({
                                    id: 'download.message.others',
                                });
                        }
                    })
            )
        );
        if (hasOther) {
            // Ensure 'download.message.others' is the last element
            undownloadableSelectedTypes = [
                ...undownloadableSelectedTypes.filter(
                    (type) =>
                        type !==
                        intl.formatMessage({ id: 'download.message.others' })
                ),
                intl.formatMessage({ id: 'download.message.others' }),
            ];
        }

        switch (undownloadableSelectedTypes.length) {
            case 4:
                messageSecondLine = intl.formatMessage(
                    { id: 'download.message.fourTypesNotDownloadable' },
                    {
                        type1: undownloadableSelectedTypes[0],
                        type2: undownloadableSelectedTypes[1],
                        type3: undownloadableSelectedTypes[2],
                        type4: undownloadableSelectedTypes[3],
                    }
                );
                break;
            case 3:
                messageSecondLine = intl.formatMessage(
                    { id: 'download.message.threeTypesNotDownloadable' },
                    {
                        type1: undownloadableSelectedTypes[0],
                        type2: undownloadableSelectedTypes[1],
                        type3: undownloadableSelectedTypes[2],
                    }
                );
                break;
            case 2:
                messageSecondLine = intl.formatMessage(
                    { id: 'download.message.twoTypesNotDownloadable' },
                    {
                        type1: undownloadableSelectedTypes[0],
                        type2: undownloadableSelectedTypes[1],
                    }
                );
                break;
            default:
                messageSecondLine = intl.formatMessage(
                    { id: 'download.message.oneTypeNotDownloadable' },
                    { type1: undownloadableSelectedTypes[0] }
                );
                break;
        }
        return (
            messageFirstLine + '\n' + capitalizeFirstLetter(messageSecondLine)
        );
    };

    const handleDownloadCases = async (selectedElements: any[]) => {
        const casesUuids = selectedElements
            .filter((element) => element.type === ElementType.CASE)
            .map((element) => element.elementUuid);
        await downloadCases(casesUuids);
        if (casesUuids.length !== selectedElements.length) {
            snackInfo({
                messageTxt: buildPartialDownloadMessage(
                    casesUuids.length,
                    selectedElements
                ),
            });
        }
    };

    return { handleDownloadCases };
}
