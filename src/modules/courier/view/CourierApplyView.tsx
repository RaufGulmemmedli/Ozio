'use client';

/**
 * `/courier/apply` — "Kuryer · Müraciət" (`B6p58`).
 *
 * Two-column: the form (Şəxsi məlumat, Nəqliyyat, Sənədlər və ödəniş, agreement, submit) beside
 * the 400-wide dark perks panel. Submitting stores the application in the mock db, which
 * auto-approves it ~4 s later, and we move to `/courier/apply/status` where that transition is
 * visible live.
 *
 * FIN, VÖEN, IBAN and the birth date are never persisted by the mock (`stripIdentifiers`).
 */
import { useTranslations } from 'next-intl';

import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { Banknote, Calendar, ShieldCheck, Zap } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { DemoBanner } from '@/shared/states';
import { Breadcrumbs, Button, Checkbox, Field, Input, Switch, toast } from '@/shared/ui';

import { CourierCard, VehicleIcon } from '../components/courier-bits';
import type { CourierVehicle } from '../data/models/courier';
import { useCourierApplyForm, type CourierField } from '../hooks/use-courier-apply-form';
import { useCourierMe, useSubmitCourierApplication } from '../hooks/use-courier';

import { CourierApplySkeleton } from './CourierApplySkeleton';

const VEHICLES: readonly CourierVehicle[] = ['foot', 'bicycle', 'scooter', 'car'];

const PERKS = [
  { icon: Calendar, title: 'apply.perk1', body: 'apply.perk1Body' },
  { icon: Banknote, title: 'apply.perk2', body: 'apply.perk2Body' },
  { icon: Zap, title: 'apply.perk3', body: 'apply.perk3Body' },
  { icon: ShieldCheck, title: 'apply.perk4', body: 'apply.perk4Body' },
] as const;

export function CourierApplyView() {
  const t = useTranslations('courier');
  const router = useRouter();

  // The city list and the known profile name would come from `me`; while it loads the drawn
  // loading frame (`jiVSM`) is what shows.
  const me = useCourierMe();
  const form = useCourierApplyForm();
  const submit = useSubmitCourierApplication();

  const issue = (field: CourierField): string | undefined => {
    const key = form.issues[field];
    return key ? t(key) : undefined;
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    form.markTouched();
    if (!form.valid) return;
    submit.mutate(form.application, {
      onSuccess: () => router.push(paths.courierApplyStatus),
      onError: (failure) =>
        toast.error({ title: t('apply.errorBanner'), body: failure.message }),
    });
  };

  return (
    <>
      <DemoBanner module="courier" body={t('demo')} />

      <PageHeader
        title={t('apply.title')}
        subtitle={t('apply.subtitle')}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: t('crumb.profile'), href: paths.profile },
              { label: t('crumb.courier') },
            ]}
          />
        }
      />

      <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start">
        {me.isPending ? (
          <CourierApplySkeleton label={t('apply.loading')} />
        ) : (
          <form className="flex min-w-0 flex-1 flex-col gap-6" onSubmit={onSubmit} noValidate>
            {form.touched && !form.valid ? (
              <p
                role="alert"
                className="m-0 w-full rounded-card bg-brand-soft px-4 py-3 text-label font-semibold text-brand-dark"
              >
                {t('apply.errorBanner')}
              </p>
            ) : null}

            {/* Şəxsi məlumat */}
            <CourierCard>
              <h2 className="m-0 text-h4 font-bold text-ink">{t('apply.personal')}</h2>
              <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={t('apply.fullName')}
                  helper={issue('fullName')}
                  state={issue('fullName') ? 'error' : 'default'}
                >
                  <Input
                    value={form.application.fullName}
                    placeholder={t('apply.fullNameHint')}
                    autoComplete="name"
                    onChange={(e) => form.set({ fullName: e.target.value })}
                  />
                </Field>
                <Field
                  label={t('apply.phone')}
                  helper={issue('phone')}
                  state={issue('phone') ? 'error' : 'default'}
                >
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={form.application.phone}
                    placeholder={t('apply.phoneHint')}
                    autoComplete="tel"
                    onChange={(e) => form.set({ phone: e.target.value })}
                  />
                </Field>
                <Field
                  label={t('apply.birthDate')}
                  helper={issue('birthDate')}
                  state={issue('birthDate') ? 'error' : 'default'}
                >
                  <Input
                    inputMode="numeric"
                    value={form.application.birthDate}
                    placeholder={t('apply.birthDateHint')}
                    onChange={(e) => form.set({ birthDate: e.target.value })}
                  />
                </Field>
                <Field
                  label={t('apply.city')}
                  helper={issue('city')}
                  state={issue('city') ? 'error' : 'default'}
                >
                  <Input
                    value={form.application.city}
                    onChange={(e) => form.set({ city: e.target.value })}
                  />
                </Field>
              </div>
            </CourierCard>

            {/* Nəqliyyat */}
            <CourierCard>
              <h2 className="m-0 text-h4 font-bold text-ink">{t('apply.vehicle')}</h2>
              <div
                role="radiogroup"
                aria-label={t('apply.vehicle')}
                className="grid w-full grid-cols-2 gap-3 md:grid-cols-4"
              >
                {VEHICLES.map((vehicle) => {
                  const selected = form.application.vehicle === vehicle;
                  return (
                    <button
                      key={vehicle}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => form.setVehicle(vehicle)}
                      className={[
                        'flex min-h-[84px] flex-col items-start gap-2.5 rounded-lg bg-surface2 p-4 text-left',
                        'outline-offset-[-1px] transition-[outline-color,background-color]',
                        selected
                          ? 'outline-2 outline-brand'
                          : 'outline-2 outline-transparent hover:bg-line',
                      ].join(' ')}
                    >
                      <VehicleIcon vehicle={vehicle} className="text-ink2" />
                      <span className="text-label font-bold text-ink">{t(`vehicle.${vehicle}`)}</span>
                    </button>
                  );
                })}
              </div>

              {form.needsPlate ? (
                <Field
                  label={t('apply.plate')}
                  helper={issue('plateNumber')}
                  state={issue('plateNumber') ? 'error' : 'default'}
                  className="md:max-w-[320px]"
                >
                  <Input
                    value={form.application.plateNumber}
                    placeholder={t('apply.plateHint')}
                    onChange={(e) => form.setPlate(e.target.value)}
                  />
                </Field>
              ) : null}

              <div className="flex w-full flex-row items-center rounded-lg bg-surface2 p-4">
                <Switch
                  checked={form.application.hasThermalBag}
                  onCheckedChange={(checked) => form.set({ hasThermalBag: checked })}
                  label={t('apply.thermalBag')}
                  description={t('apply.thermalBagNote')}
                />
              </div>
            </CourierCard>

            {/* Sənədlər və ödəniş */}
            <CourierCard>
              <h2 className="m-0 text-h4 font-bold text-ink">{t('apply.documents')}</h2>
              <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={t('apply.fin')}
                  helper={issue('idNumber')}
                  state={issue('idNumber') ? 'error' : 'default'}
                >
                  <Input
                    value={form.application.idNumber}
                    placeholder={t('apply.finHint')}
                    autoComplete="off"
                    onChange={(e) => form.setFin(e.target.value)}
                  />
                </Field>
                <Field
                  label={t('apply.voen')}
                  helper={issue('voen')}
                  state={issue('voen') ? 'error' : 'default'}
                >
                  <Input
                    inputMode="numeric"
                    value={form.application.voen}
                    placeholder={t('apply.voenHint')}
                    autoComplete="off"
                    onChange={(e) => form.setVoen(e.target.value)}
                  />
                </Field>
              </div>
              <Field
                label={t('apply.iban')}
                helper={issue('bankAccount')}
                state={issue('bankAccount') ? 'error' : 'default'}
              >
                <Input
                  value={form.application.bankAccount}
                  placeholder={t('apply.ibanHint')}
                  autoComplete="off"
                  onChange={(e) => form.setIban(e.target.value)}
                />
              </Field>

              <Field helper={issue('agreement')} state={issue('agreement') ? 'error' : 'default'}>
                <Checkbox
                  checked={form.agreed}
                  onCheckedChange={(checked) => form.setAgreed(checked === true)}
                  label={t('apply.agreement')}
                />
              </Field>

              <Button
                type="submit"
                variant="brand"
                size="3xl"
                className="w-full md:w-fit"
                loading={submit.isPending}
              >
                {t('apply.submit')}
              </Button>
            </CourierCard>
          </form>
        )}

        {/* Perks panel — static chrome, real in every state. */}
        <aside className="flex w-full shrink-0 flex-col gap-6 rounded-bento bg-block p-8 lg:w-[400px]">
          <h2 className="m-0 text-h4 font-extrabold text-on-block">{t('apply.perksTitle')}</h2>
          <ul className="m-0 flex list-none flex-col gap-5 p-0">
            {PERKS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex flex-row items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-md bg-on-block/10 text-on-block"
                >
                  <Icon size={20} />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-label font-bold text-on-block">{t(title)}</span>
                  <span className="text-caption text-on-block/70">{t(body)}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
