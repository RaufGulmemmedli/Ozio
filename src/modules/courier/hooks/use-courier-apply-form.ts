'use client';

/**
 * `/courier/apply` form state.
 *
 * Holds one `CourierApplication`, applies the input formatters the design specifies (plate
 * upper-case, FIN 7 chars upper-case, VÖEN 10 digits, IBAN in 4-groups) and reports per-field
 * errors as message keys, so no user-facing text lives here.
 */
import { useCallback, useMemo, useState } from 'react';

import {
  emptyCourierApplication,
  formatFin,
  formatIban,
  formatPlate,
  formatVoen,
  vehicleNeedsPlate,
  type CourierApplication,
  type CourierVehicle,
} from '../data/models/courier';

export type CourierField =
  | 'fullName'
  | 'phone'
  | 'birthDate'
  | 'city'
  | 'plateNumber'
  | 'idNumber'
  | 'voen'
  | 'bankAccount'
  | 'agreement';

export type CourierIssues = Partial<Record<CourierField, string>>;

const PHONE_RE = /^\+?[\d\s()-]{9,20}$/;
const DATE_RE = /^\d{2}\.\d{2}\.\d{4}$/;

export function validateCourierApplication(
  app: CourierApplication,
  agreed: boolean,
): CourierIssues {
  const issues: CourierIssues = {};

  if (app.fullName.trim() === '') issues.fullName = 'field.required';
  if (app.phone.trim() === '') issues.phone = 'field.required';
  else if (!PHONE_RE.test(app.phone.trim())) issues.phone = 'field.phone';

  if (app.birthDate.trim() !== '' && !DATE_RE.test(app.birthDate.trim())) {
    issues.birthDate = 'field.birthDate';
  }
  if (app.city.trim() === '') issues.city = 'field.required';

  if (vehicleNeedsPlate(app.vehicle) && app.plateNumber.trim() === '') {
    issues.plateNumber = 'field.plate';
  }

  const fin = app.idNumber.replace(/\s/g, '');
  if (fin === '') issues.idNumber = 'field.required';
  else if (fin.length !== 7) issues.idNumber = 'field.fin';

  const voen = app.voen.replace(/\D/g, '');
  if (voen !== '' && voen.length !== 10) issues.voen = 'field.voen';

  const iban = app.bankAccount.replace(/\s/g, '');
  if (iban === '') issues.bankAccount = 'field.required';
  else if (!/^AZ[A-Z0-9]{26}$/.test(iban)) issues.bankAccount = 'field.iban';

  if (!agreed) issues.agreement = 'field.agreement';

  return issues;
}

export function useCourierApplyForm() {
  const [application, setApplication] = useState<CourierApplication>(emptyCourierApplication);
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);

  const set = useCallback(
    (part: Partial<CourierApplication>) =>
      setApplication((prev) => ({ ...prev, ...part })),
    [],
  );

  const setVehicle = useCallback(
    (vehicle: CourierVehicle) =>
      setApplication((prev) => ({
        ...prev,
        vehicle,
        // The plate field is hidden for foot / bicycle, so its value goes with it.
        plateNumber: vehicleNeedsPlate(vehicle) ? prev.plateNumber : '',
      })),
    [],
  );

  const setPlate = useCallback(
    (raw: string) => set({ plateNumber: formatPlate(raw) }),
    [set],
  );
  const setFin = useCallback((raw: string) => set({ idNumber: formatFin(raw) }), [set]);
  const setVoen = useCallback((raw: string) => set({ voen: formatVoen(raw) }), [set]);
  const setIban = useCallback((raw: string) => set({ bankAccount: formatIban(raw) }), [set]);

  const issues = useMemo(
    () => validateCourierApplication(application, agreed),
    [application, agreed],
  );
  const valid = Object.keys(issues).length === 0;

  return {
    application,
    agreed,
    setAgreed,
    set,
    setVehicle,
    setPlate,
    setFin,
    setVoen,
    setIban,
    issues: touched ? issues : {},
    valid,
    touched,
    markTouched: () => setTouched(true),
    needsPlate: vehicleNeedsPlate(application.vehicle),
  };
}
