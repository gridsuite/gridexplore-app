/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useIntl } from 'react-intl';
import { ElementAttributes, ElementType, useSnackMessage } from '@gridsuite/commons-ui';
import { useCallback, useState } from 'react';
import { UUID } from 'crypto';
import {
    downloadCase,
    downloadSpreadsheetConfig,
    downloadSpreadsheetConfigCollection,
    fetchConvertedCase,
} from '../../utils/rest-api';

interface DownloadData {
    blob: Blob;
    filename: string;
}

const triggerDownload = ({ blob, filename }: DownloadData): void => {
    const href = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(href);
};

const downloadStrategies: { [key in ElementType]?: (element: ElementAttributes) => Promise<DownloadData> } = {
    [ElementType.CASE]: async (element: ElementAttributes) => {
        const result = await downloadCase(element.elementUuid);
        const extension = result.headers.get('extension') ?? '';
        const filename = `${element.elementName}.${extension}`;
        return { blob: await result.blob(), filename };
    },
    [ElementType.SPREADSHEET_CONFIG]: async (element: ElementAttributes) => {
        const result = await downloadSpreadsheetConfig(element.elementUuid);
        const filename = `${element.elementName}.json`;
        try {
            // Parse the JSON to ensure it's valid
            const jsonContent = await result.json();
            // Stringify with indentation for pretty formatting
            const prettyJson = JSON.stringify(jsonContent, null, 2);
            // Create a new Blob with the pretty-formatted JSON
            const blob = new Blob([prettyJson], { type: 'application/json' });
            return { blob, filename };
        } catch (error) {
            // If parsing fails, fall back to the original blob
            console.error('Error parsing JSON:', error);
            return { blob: await result.blob(), filename };
        }
    },
    [ElementType.SPREADSHEET_CONFIG_COLLECTION]: async (element: ElementAttributes) => {
        const result = await downloadSpreadsheetConfigCollection(element.elementUuid);
        const filename = `${element.elementName}.json`;
        try {
            // Parse the JSON to ensure it's valid
            const jsonContent = await result.json();
            // Stringify with indentation for pretty formatting
            const prettyJson = JSON.stringify(jsonContent, null, 2);
            // Create a new Blob with the pretty-formatted JSON
            const blob = new Blob([prettyJson], { type: 'application/json' });
            return { blob, filename };
        } catch (error) {
            // If parsing fails, fall back to the original blob
            console.error('Error parsing JSON:', error);
            return { blob: await result.blob(), filename };
        }
    },
};

export function useDownloadUtils() {
    const intl = useIntl();
    const { snackError, snackInfo } = useSnackMessage();
    const capitalizeFirstLetter = useCallback(
        (string: string) => `${string.charAt(0).toUpperCase()}${string.slice(1)}`,
        []
    );
    const [abortController, setAbortController] = useState<AbortController>();

    const handleDownloadError = useCallback(
        (element: ElementAttributes, errorMsg: string) => {
            snackError({
                headerId: 'download.error',
                headerValues: { caseName: element.elementName },
                messageTxt: errorMsg,
            });
        },
        [snackError]
    );

    const exportCase = useCallback(
        async (
            caseElement: ElementAttributes,
            format: string,
            formatParameters: {
                [parameterName: string]: any;
            },
            abortController2: AbortController,
            fileName?: string
        ): Promise<void> => {
            try {
                const result = await fetchConvertedCase(
                    caseElement.elementUuid,
                    fileName || caseElement.elementName, // if no fileName is provided or empty, the case name will be used
                    format,
                    formatParameters,
                    abortController2
                );

                let downloadFileName =
                    result.headers.get('Content-Disposition')?.split('filename=')[1] ??
                    fileName ??
                    caseElement.elementName;
                // We remove quotes
                downloadFileName = downloadFileName.substring(1, downloadFileName.length - 1);

                const blob = await result.blob();

                triggerDownload({ blob, filename: downloadFileName });
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    throw error;
                }
                handleDownloadError(caseElement, error);
            }
        },
        [handleDownloadError]
    );

    const buildPartialDownloadMessage = useCallback(
        (numberOfDownloadedElements: number, undownloadableElements: ElementAttributes[]): string => {
            // Building the snackbar message
            const messageFirstLine = intl.formatMessage(
                {
                    id:
                        numberOfDownloadedElements === 1
                            ? 'download.message.downloadedElement'
                            : 'download.message.downloadedElements',
                },
                { number: numberOfDownloadedElements }
            );

            if (undownloadableElements.length === 0) {
                return messageFirstLine;
            }

            let messageSecondLine;
            let hasOther = false;
            let undownloadableSelectedTypes: string[] = Array.from(
                new Set(
                    undownloadableElements
                        .reduce((types: string[], e) => {
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
                        (type) => type !== intl.formatMessage({ id: 'download.message.others' })
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
            return `${messageFirstLine}\n${capitalizeFirstLetter(messageSecondLine)}`;
        },
        [intl, capitalizeFirstLetter]
    );

    const stopCasesExports = useCallback(() => {
        if (abortController) {
            abortController.abort();
        }
    }, [abortController]);

    // downloads converted files one after another. The downloading may be interrupted midterm with a few files downloaded already.
    const handleConvertCases = useCallback(
        async (
            selectedElements: ElementAttributes[],
            format: string,
            formatParameters: {
                [parameterName: string]: any;
            },
            caseUuidFileNameMap?: Map<UUID, string>
        ) => {
            const cases: ElementAttributes[] = selectedElements.filter(
                (element: ElementAttributes) => element.type === ElementType.CASE
            );
            let message: string = '';

            try {
                const controller = new AbortController();
                setAbortController(controller);

                // eslint-disable-next-line no-restricted-syntax -- usage of async/await syntax
                for (const c of cases) {
                    // eslint-disable-next-line no-await-in-loop -- it's wanted because we don't want to download in parallel
                    await exportCase(c, format, formatParameters, controller, caseUuidFileNameMap?.get(c.elementUuid));
                }
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    message = intl.formatMessage({
                        id: 'download.stopped',
                    });
                }
            } finally {
                setAbortController(undefined);
                const undownloadableElements = selectedElements.filter(
                    (element: ElementAttributes) => element.type !== ElementType.CASE
                );
                if (message.length === 0 && undownloadableElements.length > 0) {
                    message += buildPartialDownloadMessage(cases.length, undownloadableElements);
                }
                if (message.length > 0) {
                    snackInfo({
                        messageTxt: message,
                    });
                }
            }
        },
        [exportCase, intl, snackInfo, buildPartialDownloadMessage]
    );

    const downloadElements = useCallback(
        async (selectedElements: ElementAttributes[]): Promise<void> => {
            const downloadableElements = selectedElements.filter((element) => downloadStrategies[element.type]);
            const undownloadableElements = selectedElements.filter((element) => !downloadStrategies[element.type]);

            // eslint-disable-next-line no-restricted-syntax -- usage of async/await syntax
            for (const element of downloadableElements) {
                try {
                    const downloadStrategy = downloadStrategies[element.type];
                    if (downloadStrategy) {
                        // eslint-disable-next-line no-await-in-loop -- it's wanted because we don't want to download in parallel
                        const downloadData = await downloadStrategy(element);
                        triggerDownload(downloadData);
                    }
                } catch (error: unknown) {
                    handleDownloadError(element, error instanceof Error ? error.message : String(error));
                }
            }

            if (undownloadableElements.length > 0) {
                const message = buildPartialDownloadMessage(downloadableElements.length, undownloadableElements);
                snackInfo({ messageTxt: message });
            }
        },
        [handleDownloadError, snackInfo, buildPartialDownloadMessage]
    );

    return { downloadElements, handleConvertCases, stopCasesExports };
}
