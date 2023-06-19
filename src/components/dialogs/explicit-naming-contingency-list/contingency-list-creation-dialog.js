import { useSelector } from 'react-redux';
import { useSnackMessage } from '@gridsuite/commons-ui';
import yup from '../../utils/yup-config';
import {
    CONTINGENCY_LIST_TYPE,
    CONTINGENCY_NAME,
    COUNTRIES_1,
    COUNTRIES_2,
    EQUIPMENT_ID,
    EQUIPMENT_IDS,
    EQUIPMENT_TABLE,
    EQUIPMENT_TYPE,
    NAME,
    NOMINAL_VOLTAGE_1,
    NOMINAL_VOLTAGE_2,
} from '../../utils/field-constants';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import {
    createContingencyList,
    elementExists,
    getContingencyList,
} from '../../../utils/rest-api';
import { useEffect } from 'react';
import {
    ContingencyListType,
    ContingencyListTypeRefactor,
    ElementType,
} from '../../../utils/elementType';
import CustomMuiDialog from '../CustomMuiDialog';
import ContingencyListCreationForm from './contingency-list-creation-form';
import {
    getRangeInputEmptyDataForm,
    getRangeInputSchema,
} from '../../utils/range-input';
import {
    DEFAULT_TABLE_ROWS,
    editContingencyList,
    getFormContent,
    getFormDataFromFetchedElement,
} from './contingency-list-utils';

const checkNameIsUnique = (name, activeDirectory) => {
    if (!name) {
        return false;
    }
    return new Promise((resolve) => {
        elementExists(activeDirectory, name, ElementType.CONTINGENCY_LIST).then(
            (val) => resolve(!val)
        );
    });
};

const emptyFormData = {
    [EQUIPMENT_ID]: null,
    [NAME]: '',
    [EQUIPMENT_TABLE]: DEFAULT_TABLE_ROWS,
    [CONTINGENCY_LIST_TYPE]: ContingencyListTypeRefactor.CRITERIA_BASED.id,
    [EQUIPMENT_TYPE]: null,
    [COUNTRIES_1]: [],
    [COUNTRIES_2]: [],
    ...getRangeInputEmptyDataForm(NOMINAL_VOLTAGE_1),
    ...getRangeInputEmptyDataForm(NOMINAL_VOLTAGE_2),
};

const ContingencyListCreationDialog = ({
    contingencyListId,
    onClose,
    open,
    titleId,
    contingencyListType,
}) => {
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const { snackError } = useSnackMessage();

    const schema = yup.object().shape({
        [NAME]: yup
            .string()
            .nullable()
            .when([EQUIPMENT_ID], {
                is: null,
                then: (schema) =>
                    schema
                        .required('nameEmpty')
                        .test('checkIfUniqueName', 'nameAlreadyUsed', (name) =>
                            checkNameIsUnique(name, activeDirectory)
                        ),
            }),
        [EQUIPMENT_TYPE]: yup.string().nullable(),
        [CONTINGENCY_LIST_TYPE]: yup.string().nullable(),
        [EQUIPMENT_TABLE]: yup.array().of(
            yup.object().shape({
                [CONTINGENCY_NAME]: yup.string().nullable(),
                [EQUIPMENT_IDS]: yup.array().of(yup.string().nullable()),
            })
        ),
        [COUNTRIES_1]: yup.array().of(
            yup.string().nullable()
        ),
        [COUNTRIES_2]:yup.array().of(
            yup.string().nullable()
        ),
        ...getRangeInputSchema(NOMINAL_VOLTAGE_1),
        ...getRangeInputSchema(NOMINAL_VOLTAGE_2),
    });

    const methods = useForm({
        defaultValues: emptyFormData,
        resolver: yupResolver(schema),
    });

    const { reset, formState:{errors} } = methods;

    useEffect(() => {
        if (contingencyListId) {
            getContingencyList(contingencyListType, contingencyListId).then(
                (response) => {
                    if (response) {
                        const formData = getFormDataFromFetchedElement(
                            response,
                            contingencyListType,
                            contingencyListId
                        );
                        reset(formData);
                    }
                }
            );
        }
    }, [contingencyListId, reset]);

    const closeAndClear = (event) => {
        reset(emptyFormData, { keepDefaultValues: true });
        onClose(event);
    };

    const handleClose = (event) => {
        closeAndClear(event);
    };

    const onSubmit = (data) => {
        console.log('data : ', errors)
        console.log('data : ', data)
        if (contingencyListId) {
            editContingencyList(contingencyListId, contingencyListType, data)
                .then(() => {
                    handleClose();
                })
                .catch((errorMessage) => {
                    snackError({
                        messageTxt: errorMessage,
                        headerId: 'contingencyListCreationError',
                        headerValues: { name: data[NAME] },
                    });
                });
        } else {
            const formContent = getFormContent(
                contingencyListId ?? null,
                data
            );
            console.log('before sending  :  ', formContent);
            createContingencyList(
                data[CONTINGENCY_LIST_TYPE],
                data[NAME],
                formContent,
                activeDirectory
            )
                .then(() => handleClose())
                .catch((errorMessage) => {
                    snackError({
                        messageTxt: errorMessage,
                        headerId: 'contingencyListEditingError',
                        headerValues: { name: data[NAME] },
                    });
                });
        }
    };
    return (
        <CustomMuiDialog
            open={open}
            onClose={closeAndClear}
            onSave={onSubmit}
            schema={schema}
            methods={methods}
            titleId={titleId}
        >
            <ContingencyListCreationForm />
        </CustomMuiDialog>
    );
};

export default ContingencyListCreationDialog;
