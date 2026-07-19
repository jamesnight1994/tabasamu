import { RegisterForm } from '../../../components/commerce/AuthForms';

export default function RegisterPage() {
  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal">
        Create your account
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
        An account is never required to order — it just makes reordering and
        subscriptions easier.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  );
}
