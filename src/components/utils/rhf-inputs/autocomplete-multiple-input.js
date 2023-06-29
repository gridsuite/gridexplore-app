import AutocompleteInput from './autocomplete-input';

const AutocompleteMultipleInput = ({ name, options, addOnBlur, ...props }) => {
    return <AutocompleteInput name={name} options={options} multiple />;
};

export default AutocompleteMultipleInput;
