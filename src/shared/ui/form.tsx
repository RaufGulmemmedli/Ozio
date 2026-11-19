'use client';

/**
 * react-hook-form glue: <Form>, <FormField> and `applyFieldErrors`.
 *
 * - validate on blur, re-validate on change once a field has errored
 *   (`useOzioForm` sets `mode: 'onBlur'` + `reValidateMode: 'onChange'`)
 * - focus the first invalid field on submit (`shouldFocusError`)
 * - `applyFieldErrors` maps the API's 422 `data: [{ path, message }]` onto `setError`
 *
 * No copy lives here: messages come from the caller's zod schema / l10n.
 */

import * as React from 'react';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type SubmitErrorHandler,
  type SubmitHandler,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';

import { Field, type FieldProps, type FieldState } from './field';

/** Structural copy of `@/core/network`'s `FieldError` — kept local so this file has no core dependency. */
export interface ApiFieldError {
  path: string;
  message: string;
}

/**
 * `useForm` with the project's validation policy baked in.
 * Pass your zod resolver as usual: `useOzioForm({ resolver: zodResolver(schema) })`.
 */
export function useOzioForm<TValues extends FieldValues>(
  options: UseFormProps<TValues> = {},
): UseFormReturn<TValues> {
  return useForm<TValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    ...options,
  });
}

export interface FormProps<TValues extends FieldValues>
  extends Omit<React.ComponentPropsWithoutRef<'form'>, 'onSubmit' | 'onError' | 'onInvalid'> {
  form: UseFormReturn<TValues>;
  onSubmit: SubmitHandler<TValues>;
  /** Called instead of `onSubmit` when validation fails. */
  onInvalid?: SubmitErrorHandler<TValues>;
}

export function Form<TValues extends FieldValues>({
  form,
  onSubmit,
  onInvalid,
  children,
  noValidate = true,
  ...rest
}: FormProps<TValues>): React.ReactElement {
  return (
    <FormProvider {...form}>
      <form noValidate={noValidate} onSubmit={form.handleSubmit(onSubmit, onInvalid)} {...rest}>
        {children}
      </form>
    </FormProvider>
  );
}

export interface FormFieldRenderArgs<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> {
  field: ControllerRenderProps<TValues, TName>;
  /** `'error'` while the field has a message, `'default'` otherwise. */
  state: FieldState;
  error?: string;
}

export interface FormFieldProps<TValues extends FieldValues, TName extends FieldPath<TValues>>
  extends Omit<FieldProps, 'children' | 'state' | 'helper' | 'htmlFor'> {
  name: TName;
  form?: UseFormReturn<TValues>;
  /** Shown when the field is valid; the error message replaces it. */
  helper?: React.ReactNode;
  /** Forces the success tick (e.g. a verified phone number). */
  success?: boolean;
  children: (args: FormFieldRenderArgs<TValues, TName>) => React.ReactNode;
}

/** <Field> + <Controller>: wires label/helper/aria and hands you RHF's `field`. */
export function FormField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  name,
  form,
  helper,
  success = false,
  children,
  ...fieldProps
}: FormFieldProps<TValues, TName>): React.ReactElement {
  const context = useFormContext<TValues>();
  const resolved = form ?? (context as UseFormReturn<TValues> | null);
  if (!resolved) {
    throw new Error('<FormField> needs a `form` prop or a surrounding <Form>.');
  }

  return (
    <Controller
      name={name}
      control={resolved.control}
      render={({ field, fieldState }) => {
        const error =
          typeof fieldState.error?.message === 'string' ? fieldState.error.message : undefined;
        const state: FieldState = error ? 'error' : success ? 'success' : 'default';
        return (
          <Field {...fieldProps} htmlFor={field.name} state={state} helper={error ?? helper}>
            {children({ field, state, error })}
          </Field>
        );
      }}
    />
  );
}

/**
 * Map a 422 envelope's `data: [{ path, message }]` onto the form.
 * Paths the form does not know about are returned so the caller can surface them
 * (usually in a banner / toast) instead of swallowing the server's message.
 */
export function applyFieldErrors<TValues extends FieldValues>(
  form: UseFormReturn<TValues>,
  fieldErrors: readonly ApiFieldError[] | null | undefined,
  options: { focus?: boolean } = {},
): ApiFieldError[] {
  if (!fieldErrors || fieldErrors.length === 0) return [];

  const known = new Set(Object.keys(form.getValues() ?? {}));
  const unmatched: ApiFieldError[] = [];
  let focused: boolean = false;

  for (const entry of fieldErrors) {
    // the API sends `address.city` / `items[0].qty`; RHF understands both
    const root = entry.path.split(/[.[]/u)[0] ?? entry.path;
    if (!known.has(root)) {
      unmatched.push(entry);
      continue;
    }
    const shouldFocus: boolean = (options.focus ?? true) && !focused;
    form.setError(
      entry.path as FieldPath<TValues>,
      { type: 'server', message: entry.message },
      { shouldFocus },
    );
    focused = focused || shouldFocus;
  }

  return unmatched;
}
