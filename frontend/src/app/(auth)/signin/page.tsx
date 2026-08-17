import { SignInForm } from '../../../components/commerce/AuthForms';

export default function SignInPage() {
  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal">
        Welcome back
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
        Sign in to see your orders, addresses and subscription.
      </p>
      <div className="mt-8">
        <SignInForm />
      </div>
    </div>
  );
}
