/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    downloadCase,
    fetchConvertedCase,
    getCaseOriginalName,
} from '../../utils/rest-api';
import { useIntl } from 'react-intl';
import {
    ElementAttributes,
    ElementType,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { useCallback, useState } from 'react';

const downloadCases = async (selectedCases: ElementAttributes[]) => {
    for (const selectedCase of selectedCases) {
        const result = await downloadCase(selectedCase.elementUuid);
        let caseOriginalName = await getCaseOriginalName(
            selectedCase.elementUuid
        );
        let caseFormat =
            typeof caseOriginalName === 'string'
                ? caseOriginalName.split('.').pop()
                : 'xiidm';
        let caseName = selectedCase.elementName;
        const filename = `${caseName}.${caseFormat}`;
        const blob = await result.blob();
        const href = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export function useDownloadUtils() {
    const intl = useIntl();
    const { snackError, snackInfo } = useSnackMessage();
    const capitalizeFirstLetter = (string: string) =>
        `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
    const [abortController, setAbortController] = useState<AbortController>();

    const handleCaseExportError = (caseElement: any, errorMsg: string) =>
        snackError({
            headerId: 'download.error',
            headerValues: { caseName: caseElement.elementName },
            messageTxt: errorMsg,
        });

    const exportCase = async (
        caseElement: ElementAttributes,
        format: string,
        formatParameters: {
            [parameterName: string]: any;
        },
        abortController: AbortController,
        fileName: string
    ): Promise<void> => {
        try {
            // if no fileName is provided, the case name will be used
            const autoName: boolean = fileName === undefined || fileName === '';
            const result = await fetchConvertedCase(
                caseElement.elementUuid,
                autoName ? caseElement.elementName : fileName,
                format,
                formatParameters,
                abortController
            );

            fileName = result.headers
                .get('Content-Disposition')
                .split('filename=')[1];
            fileName = fileName.substring(1, fileName.length - 1); // We remove quotes

            const blob = await result.blob();

            const href = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            link.setAttribute('download', `${fileName}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw error;
            }
            handleCaseExportError(caseElement, error);
        }
    };

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

    const stopCasesExports = useCallback(() => {
        if (abortController) {
            abortController.abort();
        }
    }, [abortController]);

    // downloads converted files one after another. The downloading may be interrupted midterm with a few files downloaded already.
    const handleConvertCases = async (
        selectedElements: ElementAttributes[],
        format: string,
        formatParameters: {
            [parameterName: string]: any;
        },
        fileName: string
    ) => {
        const cases: ElementAttributes[] = selectedElements.filter(
            (element: ElementAttributes) => element.type === ElementType.CASE
        );
        let message: string = '';

        try {
            const controller = new AbortController();
            setAbortController(controller);

            for (const c of cases) {
                await exportCase(
                    c,
                    format,
                    formatParameters,
                    controller,
                    fileName
                );
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                message = intl.formatMessage({
                    id: 'download.stopped',
                });
            }
        } finally {
            setAbortController(undefined);

            if (
                message.length === 0 &&
                cases.length !== selectedElements.length
            ) {
                message += buildPartialDownloadMessage(
                    cases.length,
                    selectedElements
                );
            }
            if (message.length > 0) {
                snackInfo({
                    messageTxt: message,
                });
            }
        }
    };

    const handleDownloadCases = async (selectedElements: any[]) => {
        const selectedCases = selectedElements.filter(
            (element) => element.type === ElementType.CASE
        );

        await downloadCases(selectedCases);
        if (selectedCases.length !== selectedElements.length) {
            snackInfo({
                messageTxt: buildPartialDownloadMessage(
                    selectedCases.length,
                    selectedElements
                ),
            });
        }
    };

    return { handleDownloadCases, handleConvertCases, stopCasesExports };
}
