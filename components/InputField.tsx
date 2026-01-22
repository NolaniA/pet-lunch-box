import { Input } from "@heroui/input";
import { Skeleton } from "@heroui/skeleton";

const regexMap = {
  hour: /^(?:[0-9]|1[0-9]|2[0-3])$/, // 0–23
  minute: /^[0-5]?[0-9]$/, // 0–59
  duration_sec: /^(?![6-9][1-9])[0-9]{1,2}$/, // 0–60
};

interface InputFieldProps {
  rowIndex: number;
  field: "hour" | "minute" | "duration_sec";
  label: string;
  value: number;
  max: number;
  error?: string;
  onChange: (value: number) => void;
}

const InputField: React.FC<InputFieldProps> = ({ rowIndex, field, label, value, onChange, max, error }) => {
  const regex = regexMap[field];

  return (
    <>
        <Input
          name={`${rowIndex}.${field}`}
          type="number"
          fullWidth
          label={label}
          labelPlacement="outside"
          value={value.toString()}
          min={0}
          max={max}
          size="sm"
          isInvalid={!!error}
          errorMessage={error}
          onChange={(e) => onChange(Number(e.target.value))}
          classNames={{ base: "h-15" }}
        />
    </>
  );
};

export default InputField;
