/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const HORIZONTAL_SHIFT = 16;
export const VERTICAL_SHIFT = -4;
export const MOUSE_EVENT_RIGHT_BUTTON = 2;

export const DialogsId = {
    RENAME: 'rename',
    DELETE: 'delete',
    MOVE: 'move',
    MOVE_DIRECTORY: 'moveDirectory',
    EXPORT: 'export',
    ADD_NEW_STUDY_FROM_CASE: 'create_study_from_case',
    ADD_NEW_STUDY: 'create_study',
    CONVERT_TO_EXPLICIT_NAMING_FILTER: 'convert_to_explicit_naming_filter',
    CREATE_SPREADSHEET_COLLECTION: 'create_spreadsheet_collection',
    GENERIC_FILTER: 'generic_filter',
    ADD_ROOT_DIRECTORY: 'add_root_directory',
    ADD_DIRECTORY: 'add_directory',
    ADD_NEW_CONTINGENCY_LIST: 'add_new_contingency_list',
    ADD_NEW_FILTER: 'add_new_filter',
    ADD_NEW_CRITERIA_FILTER: 'add_new_criteria_filter',
    ADD_NEW_EXPLICIT_NAMING_FILTER: 'add_new_explicit_naming_filter',
    ADD_NEW_CASE: 'add_new_case',
    RENAME_DIRECTORY: 'rename_directory',
    DELETE_DIRECTORY: 'delete_directory',
    DIRECTORY_PROPERTIES: 'directory_properties',
    EDIT_PARAMETERS: 'edit_parameters',
    NONE: 'none',
};

export const HTTP_OK = 200;
export const HTTP_UNPROCESSABLE_ENTITY_STATUS = 422;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_CONNECTION_FAILED_MESSAGE = 'failed: Connection refused';
export const HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE = 'MAX_ELEMENTS_EXCEEDED';

export enum PermissionCheckResult {
    PARENT_PERMISSION_DENIED = 'PARENT_PERMISSION_DENIED',
    TARGET_PERMISSION_DENIED = 'TARGET_PERMISSION_DENIED',
    CHILD_PERMISSION_DENIED = 'CHILD_PERMISSION_DENIED',
}
