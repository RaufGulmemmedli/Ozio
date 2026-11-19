/**
 * `@/shared/ui` — the single public barrel.
 *
 * This file lists the buttons & form controls (package F7) and re-exports
 * `./index.overlays` (package F8: overlays, navigation, display, feedback).
 */

export * from './index.overlays';

export { Button, Spinner, type ButtonProps, type ButtonSize, type ButtonVariant } from './button';
export {
  IconButton,
  type IconButtonProps,
  type IconButtonSize,
  type IconButtonTone,
} from './icon-button';
export {
  Field,
  useFieldControl,
  type FieldControlAria,
  type FieldProps,
  type FieldState,
} from './field';
export {
  Input,
  INPUT_ADORNMENT_CLASSES,
  INPUT_CONTROL_CLASSES,
  inputShellClasses,
  type InputProps,
  type InputVariant,
  type ShellOptions,
} from './input';
export { Textarea, type TextareaProps } from './textarea';
export { PhoneInput, type PhoneInputProps, type PhoneValue } from './phone-input';
export { OtpInput, type OtpInputProps } from './otp-input';
export {
  Select,
  SelectItem,
  SELECT_CONTENT_CLASSES,
  SELECT_ITEM_CLASSES,
  type SelectOption,
  type SelectProps,
} from './select';
export { Checkbox, type CheckboxProps } from './checkbox';
export { Radio, RadioGroup, type RadioGroupProps, type RadioProps } from './radio';
export { Switch, type SwitchProps } from './switch';
export { Slider, type SliderProps } from './slider';
export {
  DateField,
  DatePicker,
  addDays,
  addMonths,
  isSameDay,
  startOfDay,
  startOfMonth,
  type DateFieldProps,
  type DatePickerLabels,
  type DatePickerProps,
} from './date-picker';
export {
  QuantityStepper,
  type QuantityStepperProps,
  type QuantityStepperSize,
  type QuantityUnit,
} from './quantity-stepper';
export { Price, type PriceProps, type PriceSize, type PriceTone } from './price';
export {
  Form,
  FormField,
  applyFieldErrors,
  useOzioForm,
  type ApiFieldError,
  type FormFieldProps,
  type FormFieldRenderArgs,
  type FormProps,
} from './form';
