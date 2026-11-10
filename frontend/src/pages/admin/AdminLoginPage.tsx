import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminLogin } from '@/lib/api/gas-client';
import { setAdminToken, isAdminAuthenticated } from '@/lib/auth/admin-auth';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('admin');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAdminAuthenticated()) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin/forms';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await adminLogin(username.trim(), password);
      if (res.ok && res.token) {
        setAdminToken(res.token);
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin/forms';
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'نام کاربری یا رمز عبور اشتباه است.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ارتباط با سرور.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
            <Lock className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">ورود به پنل مدیریت فرم‌ها</CardTitle>
          <CardDescription className="text-xs">
            برای ایجاد فرم جدید و ویرایش ساختار، لطفاً وارد شوید.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">نام کاربری</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  dir="ltr"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="ps-9 text-start font-mono text-sm"
                />
                <User className="w-4 h-4 text-muted-foreground absolute start-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="ps-9 text-start font-mono text-sm"
                />
                <Lock className="w-4 h-4 text-muted-foreground absolute start-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/60 text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                اطلاعات ورود پیش‌فرض محیط توسعه:
              </div>
              <p>نام کاربری: <code className="bg-background px-1 rounded">admin</code> | رمز عبور: <code className="bg-background px-1 rounded">admin</code></p>
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex flex-col gap-2">
            <Button type="submit" disabled={isLoading} className="w-full gap-2 h-11 font-semibold">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال احراز هویت...</span>
                </>
              ) : (
                <>
                  <span>ورود به سیستم</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

