import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Mail, Lock, User, ChevronRight, Sparkles, Shield, Clock, AlertCircle, BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { showSuccess, showError, getErrorMessage } from '@/lib/errorHandling';

import { useAuth } from '@/contexts/AuthContext';
import { Language, languages, translations } from '@/lib/i18n';
import { LanguageFlag } from '@/components/ui/language-flag';

const createLoginSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('validation.invalidEmail')),
  password: z.string().min(1, t('validation.passwordRequired')),
});

const createSignupSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('validation.invalidEmail')),
  password: z.string().min(6, t('validation.passwordMin')),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['office_staff', 'mechanic', 'manager']),
  preferredLanguage: z.enum(['en', 'fr', 'ro', 'pt']),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('validation.passwordsDontMatch'),
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<ReturnType<typeof createSignupSchema>>;
type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [signupLanguage, setSignupLanguage] = useState<Language>('en');
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, signup, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'manager' || user.role === 'admin') {
        navigate('/manager', { replace: true });
      } else if (user.role === 'office_staff') {
        navigate('/office', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  const t = (key: string) => translations[signupLanguage]?.[key] || translations.en[key] || key;

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(createSignupSchema(t)),
    defaultValues: {
      email: '', password: '', confirmPassword: '',
      fullName: '', role: 'mechanic', preferredLanguage: 'en',
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    const result = await login(data.email, data.password);
    if (!result.success) {
      setLoginError(result.error || t('validation.invalidCredentials'));
    }
  };

  const onSignupSubmit = async (data: SignupFormData) => {
    const result = await signup({
      email: data.email, password: data.password, fullName: data.fullName,
      role: data.role as any, preferredLanguage: data.preferredLanguage,
    });
    if (result.success) {
      showSuccess(t('auth.welcome'), 'Account created successfully!');
    } else {
      showError('Signup failed', getErrorMessage(result.error || 'Could not create account'));
    }
  };

  const handleLanguageSelect = (lang: Language) => {
    setSignupLanguage(lang);
    signupForm.setValue('preferredLanguage', lang);
  };

  const renderLoginForm = () => (
    <Form {...loginForm}>
      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5 animate-fade-in">
        {loginError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive animate-fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{loginError}</p>
          </div>
        )}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm space-y-1">
          <p className="font-semibold text-primary mb-2">Demo Accounts:</p>
          <p className="text-muted-foreground"><span className="font-medium">Manager:</span> manager@garage.com / manager123</p>
          <p className="text-muted-foreground"><span className="font-medium">Office:</span> sarah@garage.com / office123</p>
          <p className="text-muted-foreground"><span className="font-medium">Mechanic:</span> pierre@garage.com / mech123</p>
        </div>
        <FormField control={loginForm.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-foreground font-medium">{t('auth.email')}</FormLabel>
            <FormControl>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input {...field} type="email" placeholder={t('auth.emailPlaceholder')}
                  className="pl-12 h-14 text-base bg-background border-2 border-border rounded-xl focus:border-primary transition-all duration-300" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={loginForm.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-foreground font-medium">{t('auth.password')}</FormLabel>
            <FormControl>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input {...field} type="password" placeholder="••••••••"
                  className="pl-12 h-14 text-base bg-background border-2 border-border rounded-xl focus:border-primary transition-all duration-300" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full h-14 text-base font-semibold btn-premium btn-royal mt-6">
          {t('auth.login')} <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button type="button" onClick={() => { setIsLogin(false); setStep(1); setLoginError(null); }}
            className="text-primary font-semibold hover:underline">Sign up</button>
        </p>
      </form>
    </Form>
  );

  const renderSignupStep1 = () => (
    <div className="space-y-5 animate-fade-in">
      <FormField control={signupForm.control} name="fullName" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-foreground font-medium">{t('auth.fullName')}</FormLabel>
          <FormControl>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input {...field} placeholder={t('placeholder.johnDoe')}
                className="pl-12 h-14 text-base bg-background border-2 border-border rounded-xl focus:border-primary transition-all duration-300" />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={signupForm.control} name="email" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-foreground font-medium">{t('auth.email')}</FormLabel>
          <FormControl>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input {...field} type="email" placeholder={t('auth.emailPlaceholder')}
                className="pl-12 h-14 text-base bg-background border-2 border-border rounded-xl focus:border-primary transition-all duration-300" />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={signupForm.control} name="password" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-foreground font-medium">{t('auth.password')}</FormLabel>
          <FormControl>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input {...field} type="password" placeholder="••••••••"
                className="pl-12 h-14 text-base bg-background border-2 border-border rounded-xl focus:border-primary transition-all duration-300" />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={signupForm.control} name="confirmPassword" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-foreground font-medium">{t('auth.confirmPassword')}</FormLabel>
          <FormControl>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input {...field} type="password" placeholder="••••••••"
                className="pl-12 h-14 text-base bg-background border-2 border-border rounded-xl focus:border-primary transition-all duration-300" />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <Button type="button" className="w-full h-14 text-base font-semibold btn-premium btn-royal mt-6"
        onClick={() => {
          const values = signupForm.getValues();
          if (values.fullName && values.email && values.password && values.confirmPassword) {
            if (values.password !== values.confirmPassword) {
              signupForm.setError('confirmPassword', { message: t('validation.passwordsDontMatch') });
              return;
            }
            setStep(2);
          } else {
            signupForm.trigger(['fullName', 'email', 'password', 'confirmPassword']);
          }
        }}>
        {t('auth.continue')} <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button type="button" onClick={() => { setIsLogin(true); setStep(1); }}
          className="text-primary font-semibold hover:underline">Log in</button>
      </p>
    </div>
  );

  const renderSignupStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-2">
        <h3 className="text-xl font-bold text-foreground mb-2">{t('auth.selectRole')}</h3>
        <p className="text-sm text-muted-foreground">{t('auth.selectRoleDesc')}</p>
      </div>
      <FormField control={signupForm.control} name="role" render={({ field }) => (
        <FormItem>
          <FormControl>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-1 gap-4">
              {[
                { value: 'manager', label: 'Manager', icon: <BarChart3 className="h-5 w-5 text-primary" />, desc: 'Full access to analytics, team management, quotes, invoices, and all settings.' },
                { value: 'office_staff', label: t('auth.officeStaff'), icon: <Shield className="h-5 w-5 text-primary" />, desc: t('auth.officeStaffDesc') },
                { value: 'mechanic', label: t('auth.mechanic'), icon: <Wrench className="h-5 w-5 text-primary" />, desc: t('auth.mechanicDesc') },
              ].map(opt => (
                <Label key={opt.value} htmlFor={`role-${opt.value}`}
                  className={`relative flex items-start gap-4 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover-lift ${
                    field.value === opt.value ? 'border-primary bg-primary/5 shadow-glow' : 'border-border bg-card hover:border-primary/50 hover:shadow-premium'
                  }`}>
                  <RadioGroupItem value={opt.value} id={`role-${opt.value}`} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {opt.icon}
                      <div className="font-semibold text-base">{opt.label}</div>
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{opt.desc}</div>
                  </div>
                  {field.value === opt.value && <Sparkles className="absolute top-6 right-6 h-5 w-5 text-gold animate-bounce-subtle" />}
                </Label>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1 h-14 text-base font-medium rounded-xl border-2" onClick={() => setStep(1)}>
          {t('auth.back')}
        </Button>
        <Button type="button" className="flex-1 h-14 text-base font-semibold btn-premium btn-royal" onClick={() => setStep(3)}>
          Next <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  const renderSignupStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-2">
        <h3 className="text-xl font-bold text-foreground mb-2">{t('auth.selectLanguage')}</h3>
        <p className="text-sm text-muted-foreground">{t('auth.selectLanguageDesc')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {languages.map((lang) => (
          <button key={lang.code} type="button" onClick={() => handleLanguageSelect(lang.code)}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 hover-lift ${
              signupLanguage === lang.code ? 'border-primary bg-primary/5 shadow-glow' : 'border-border bg-card hover:border-primary/50 hover:shadow-premium'
            }`}>
            <LanguageFlag code={lang.code} size="lg" />
            <span className="font-semibold text-sm">{lang.label}</span>
            {signupLanguage === lang.code && <Sparkles className="h-4 w-4 text-gold" />}
          </button>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1 h-14 text-base font-medium rounded-xl border-2" onClick={() => setStep(2)}>
          {t('auth.back')}
        </Button>
        <Button type="submit" className="flex-1 h-14 text-base font-semibold btn-premium btn-royal"
          onClick={signupForm.handleSubmit(onSignupSubmit)}>
          {t('auth.createAccount')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 gradient-royal-radial opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(45_97%_60%_/_0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(224_76%_58%_/_0.1),transparent_50%)]" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-subtle" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />

      <div className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center p-4 lg:p-8 gap-12">
        <div className="hidden lg:flex flex-col items-start max-w-xl animate-slide-up">
          <div className="mb-8">
            <div className="w-20 h-20 rounded-3xl gradient-royal shadow-premium-lg flex items-center justify-center mb-6 hover-lift">
              <Wrench className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4"><span className="text-gradient-royal">GaragePro</span></h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">{t('auth.heroDescription')}</p>
          </div>
          <div className="space-y-4 w-full">
            {[
              { icon: <Clock className="w-6 h-6 text-white" />, grad: 'gradient-royal', title: t('auth.realtimeUpdates'), desc: t('auth.realtimeUpdatesDesc') },
              { icon: <Shield className="w-6 h-6 text-gold-foreground" />, grad: 'gradient-gold', title: t('auth.secureReliable'), desc: t('auth.secureReliableDesc') },
              { icon: <Sparkles className="w-6 h-6 text-white" />, grad: 'gradient-royal', title: t('auth.easyToUse'), desc: t('auth.easyToUseDesc') },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl glass-light hover-lift">
                <div className={`w-12 h-12 rounded-xl ${item.grad} flex items-center justify-center flex-shrink-0`}>{item.icon}</div>
                <div><h3 className="font-semibold mb-1">{item.title}</h3><p className="text-sm text-muted-foreground">{item.desc}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:hidden flex flex-col items-center mb-6 animate-slide-down">
          <div className="w-16 h-16 rounded-2xl gradient-royal shadow-premium-lg flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-royal mb-2">GaragePro</h1>
          <p className="text-center text-muted-foreground text-sm">{t('auth.professionalWorkshop')}</p>
        </div>

        <Card className="w-full max-w-md glass-strong border-0 shadow-premium-xl animate-scale-in">
          <CardHeader className="text-center pb-6 pt-8 px-8">
            <CardTitle className="text-2xl font-bold">
              {isLogin ? t('auth.login') : t('auth.signup')}
            </CardTitle>
            {!isLogin && (
              <CardDescription className="text-base mt-2">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {t('auth.stepIndicator').replace('{step}', step.toString())}
                </span>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {isLogin ? renderLoginForm() : (
              <Form {...signupForm}>
                <form className="space-y-4">
                  {step === 1 && renderSignupStep1()}
                  {step === 2 && renderSignupStep2()}
                  {step === 3 && renderSignupStep3()}
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
