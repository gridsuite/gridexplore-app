declare module '@gridsuite/commons-ui' {
    import { ReactElement } from 'react';
    import { AutocompleteProps } from '@mui/material/Autocomplete/Autocomplete';
    import { TextFieldProps } from '@mui/material';
    import { RadioGroupProps } from '@mui/material';

    interface SnackInputs {
        messageTxt?: string;
        messageId?: string;
        messageValues?: string[];
        headerTxt?: string;
        headerId?: string;
        headerValues?: string[];
    }

    interface UseSnackMessageReturn {
        snackError: (snackInputs: SnackInputs) => void;
        snackWarning: (snackInputs: SnackInputs) => void;
        snackInfo: (snackInputs: SnackInputs) => void;
    }

    export function useSnackMessage(): UseSnackMessageReturn;

    type Input = string | number;
    type Options = Array<{
        id: string;
        label: string;
    }>;

    interface AutocompleteInputProps
        extends Omit<
            AutocompleteProps<
                string,
                boolean | undefined,
                boolean | undefined,
                boolean | undefined
            >,
            'renderInput' // we already defined it in our custom Autocomplete
        > {
        name: string;
        label?: string;
        options: Array<any>; // https://mui.com/material-ui/react-autocomplete/#options-structure
        outputTransform?: (value: string) => string;
        inputTransform?: (value: string) => string;
        readOnly?: boolean;
        previousValue?: string;
        allowNewValue?: boolean;
        onChangeCallback?: () => void;
        formProps?: TextFieldProps;
    }

    export function AutocompleteInput(props: AutocompleteInputProps);

    interface ErrorInputProps {
        name: string;
        InputField?: ReactElement;
    }

    export function ErrorInput(props: ErrorInputProps);

    export function SelectInput(
        props: Omit<
            AutocompleteInputProps,
            'outputTransform' | 'inputTransform' | 'readOnly' | 'getOptionLabel' // already defined in SelectInput
        >
    );

    interface TextFieldWithAdornmentProps extends TextFieldProps {
        // variant already included in TextFieldProps
        value: Input; // we override the default type of TextFieldProps which is unknown
        adornmentPosition: string;
        adornmentText: string;
        handleClearValue?: () => void;
    }

    interface TextInputProps {
        name: string;
        label?: string;
        labelValues?: any; // it's for values from https://formatjs.io/docs/react-intl/components/#formattedmessage
        id?: string;
        adornment?: {
            position: string;
            text: string;
        };
        customAdornment?: ReactElement;
        outputTransform?: (value: string) => Input;
        inputTransform?: (value: Input) => string;
        acceptValue?: (value: string) => boolean;
        previousValue?: Input;
        clearable?: boolean;
        formProps?: TextFieldWithAdornmentProps | TextFieldProps;
    }

    export function TextInput(props: TextInputProps);

    export function FloatInput(
        props: Omit<
            TextInputProps,
            'outputTransform' | 'inputTransform' | 'acceptValue' // already defined in FloatInput
        >
    );

    interface RadioInputProps {
        name: string;
        label?: string;
        id?: string;
        options: Options;
        formProps?: RadioGroupProps;
    }

    export function RadioInput(props: RadioInputProps);

    export function SubmitButton(props: {
        onClick: () => void;
        disabled?: boolean;
    });

    export function FieldLabel(props: {
        label: string;
        optional?: boolean;
        values?: any; // it's for values from https://formatjs.io/docs/react-intl/components/#formattedmessage
    });
}
