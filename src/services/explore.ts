/*
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ElementType, ExploreComSvc, getRequestParam } from '@gridsuite/commons-ui';
import { UUID } from 'crypto';
import { getUser } from '../redux/store';
import { ContingencyListType } from '../utils/elementType';
import { EquipmentType } from '../utils/equipment-types-for-predefined-properties-mapper';
import { FORM_CONTINGENCY_LISTS, getContingencyUriParamType } from './utils';

//TODO: temporary type, check if already defined elsewhere
type saveCriteriaBasedContingencyListForm = {
    name: string;
    equipmentType: unknown;
    criteriaBased: any;
};

export default class ExploreSvc extends ExploreComSvc {
    public constructor() {
        super(getUser);
    }

    public async deleteElement(elementUuid: UUID) {
        console.debug("Deleting element %s'", elementUuid);
        return this.backendFetchJson(`${this.getPrefix(1)}/explore/elements/${elementUuid}`, 'DELETE');
    }

    public async deleteElements(elementUuids: UUID[], activeDirectory: unknown) {
        console.debug('Deleting elements : %s', elementUuids);
        await this.backendFetch(
            `${this.getPrefix(1)}/explore/elements/${activeDirectory}?${getRequestParam('ids', elementUuids)}`,
            'DELETE'
        );
    }

    public async moveElementsToDirectory(elementsUuids: UUID[], targetDirectoryUuid: UUID) {
        console.debug('Moving elements to directory %s', targetDirectoryUuid);
        return this.backendSendFetchJson(
            `${this.getPrefix(1)}/explore/elements?targetDirectoryUuid=${targetDirectoryUuid}`,
            'PUT',
            JSON.stringify(elementsUuids)
        );
    }

    public async renameElement(elementUuid: UUID, newElementName: string) {
        console.debug('Renaming element ' + elementUuid);
        return this.backendSendFetchJson(
            `${this.getPrefix(1)}/explore/elements/${elementUuid}`,
            'PUT',
            JSON.stringify({
                elementName: newElementName,
            })
        );
    }

    public async createStudy(
        studyName: string,
        studyDescription: string,
        caseUuid: UUID,
        duplicateCase: string,
        parentDirectoryUuid: UUID,
        importParameters: BodyInit,
        caseFormat: string
    ) {
        console.debug('Creating a new study...');
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('duplicateCase', duplicateCase);
        urlSearchParams.append('description', studyDescription);
        urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
        urlSearchParams.append('caseFormat', caseFormat);
        await this.backendSend(
            `${this.getPrefix(1)}/explore/studies/${encodeURIComponent(studyName)}/cases/${encodeURIComponent(
                caseUuid
            )}?${urlSearchParams}`,
            'POST',
            importParameters
        );
    }

    public async createCase(name: string, description: string, file: File, parentDirectoryUuid: UUID) {
        console.debug('Creating a new case...');
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('description', description);
        urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
        const formData = new FormData();
        formData.append('caseFile', file);
        await this.backendSend(
            `${this.getPrefix(1)}/explore/cases/${encodeURIComponent(name)}?${urlSearchParams}`,
            'POST',
            formData
        );
    }

    public async duplicateElement(
        sourceCaseUuid: UUID,
        parentDirectoryUuid: UUID,
        type: ElementType,
        specificType?: string
    ) {
        console.debug('Duplicating an element of type ' + type + ' ...');
        const queryParams = new URLSearchParams();
        queryParams.append('duplicateFrom', sourceCaseUuid);
        if (parentDirectoryUuid) {
            queryParams.append('parentDirectoryUuid', parentDirectoryUuid);
        }
        if (specificType) {
            queryParams.append('type', specificType);
        }
        await this.backendFetch(
            `${this.getPrefix(1)}/explore${ExploreSvc.getDuplicateEndpoint(type)}?${queryParams}`,
            'POST'
        );
    }

    private static getDuplicateEndpoint(type: EquipmentType) {
        switch (type) {
            case ElementType.CASE:
                return '/cases';
            case ElementType.STUDY:
                return '/studies';
            case ElementType.FILTER:
                return '/filters';
            case ElementType.CONTINGENCY_LIST:
                return '/contingency-lists';
            //TODO: not existing type, wasn't check because was in js file...
            // case ElementType.PARAMETERS: return '/parameters';
            case ElementType.MODIFICATION:
                return '/modifications';
            default:
                break;
        }
    }

    public async createContingencyList(
        contingencyListType: unknown,
        contingencyListName: string,
        description: string,
        formContent: unknown,
        parentDirectoryUuid: UUID
    ) {
        console.debug('Creating a new contingency list...');
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('description', description);
        urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
        const typeUriParam = getContingencyUriParamType(contingencyListType);
        await this.backendSend(
            `${this.getPrefix(1)}/explore${typeUriParam}/${encodeURIComponent(contingencyListName)}?${urlSearchParams}`,
            'POST',
            JSON.stringify(formContent)
        );
    }

    /**
     * Saves a Filter contingency list
     * @returns {Promise<void>}
     */
    public async saveCriteriaBasedContingencyList(id: string, form: saveCriteriaBasedContingencyListForm) {
        const { name, equipmentType, criteriaBased } = form;
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('name', name);
        urlSearchParams.append('contingencyListType', ContingencyListType.CRITERIA_BASED.id);
        await this.backendSend(
            `${this.getPrefix(1)}/explore/contingency-lists/${id}?${urlSearchParams}`,
            'PUT',
            JSON.stringify({
                ...criteriaBased,
                equipmentType,
                nominalVoltage1: criteriaBased.nominalVoltage1 === '' ? -1 : criteriaBased.nominalVoltage1,
            })
        );
    }

    /**
     * Saves a script contingency list
     * @returns {Promise<void>}
     */
    public async saveScriptContingencyList(scriptContingencyList: any, name: string) {
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('name', name);
        urlSearchParams.append('contingencyListType', ContingencyListType.SCRIPT.id);
        await this.backendSend(
            `${this.getPrefix(1)}/explore/contingency-lists/${scriptContingencyList.id}?${urlSearchParams}`,
            'PUT',
            JSON.stringify(scriptContingencyList)
        );
    }

    /**
     * Saves an explicit naming contingency list
     * @returns {Promise<void>}
     */
    public async saveExplicitNamingContingencyList(explicitNamingContingencyList: any, name: string) {
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('name', name);
        urlSearchParams.append('contingencyListType', ContingencyListType.EXPLICIT_NAMING.id);
        await this.backendSend(
            `${this.getPrefix(1)}/explore/contingency-lists/${explicitNamingContingencyList.id}?${urlSearchParams}`,
            'PUT',
            JSON.stringify(explicitNamingContingencyList)
        );
    }

    /**
     * Replace form contingency list with script contingency list
     * @returns {Promise<void>}
     */
    public async replaceFormContingencyListWithScript(id: string, parentDirectoryUuid: UUID) {
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
        await this.backendFetch(
            `${this.getPrefix(1)}/explore${FORM_CONTINGENCY_LISTS}/${encodeURIComponent(
                id
            )}/replace-with-script?${urlSearchParams}`,
            'POST'
        );
    }

    /**
     * Save new script contingency list from form contingency list
     * @returns {Promise<Response>}
     */
    public async newScriptFromFiltersContingencyList(id: string, newName: string, parentDirectoryUuid: UUID) {
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
        await this.backendFetch(
            `${this.getPrefix(1)}/explore${FORM_CONTINGENCY_LISTS}/${encodeURIComponent(
                id
            )}/new-script/${encodeURIComponent(newName)}?${urlSearchParams}`,
            'POST'
        );
    }

    /**
     * Replace filter with script filter
     * @returns {Promise<void>}
     */
    public async replaceFiltersWithScript(id: string, parentDirectoryUuid: UUID) {
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
        await this.backendFetch(
            `${this.getPrefix(1)}/explore/filters/${encodeURIComponent(id)}/replace-with-script?${urlSearchParams}`,
            'POST'
        );
    }

    /**
     * Save new script from filters
     * @returns {Promise<void>}
     */
    public async newScriptFromFilter(id: string, newName: string, parentDirectoryUuid: UUID) {
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
        await this.backendFetch(
            `${this.getPrefix(1)}/explore/filters/${encodeURIComponent(id)}/new-script/${encodeURIComponent(
                newName
            )}?${urlSearchParams}`,
            'POST'
        );
    }
}
