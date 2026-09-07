'use client';
import { apiErrorMessage } from '@/lib/api-error';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// ── Shared primitives ─────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--steel)',
  border: '1px solid var(--border)',
  color: 'var(--white)',
  outline: 'none',
  width: '100%',
};

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-dm-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--dim)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        className="px-3 py-2.5 text-sm font-dm-sans"
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--red)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
    </div>
  );
}

function Alert({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose: () => void }) {
  const isSuccess = type === 'success';
  return (
    <div
      className="font-dm-mono text-xs px-3 py-2 flex items-center justify-between gap-3"
      style={{
        background: isSuccess ? 'rgba(34,197,94,0.1)' : 'rgba(224,48,48,0.1)',
        border: `1px solid ${isSuccess ? '#22c55e' : 'var(--red)'}`,
        color: isSuccess ? '#22c55e' : 'var(--red)',
      }}
    >
      <span>{message}</span>
      <button onClick={onClose} className="underline shrink-0">Stäng</button>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}>
      <div
        className="px-5 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h2 className="font-dm-mono text-xs uppercase tracking-[4px]" style={{ color: 'var(--red)' }}>
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SaveButton({ loading, label = 'Spara', loadingLabel = 'Sparar...' }: { loading: boolean; label?: string; loadingLabel?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="font-dm-mono text-xs uppercase tracking-wider px-5 py-2.5 transition-opacity disabled:opacity-50"
      style={{ background: 'var(--red)', color: 'var(--white)' }}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

// ── Feature 1: Byta lösenord ──────────────────────────────────────────────────

function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (next !== confirm) {
      setAlert({ type: 'error', msg: 'De nya lösenorden matchar inte' });
      return;
    }
    if (next.length < 6) {
      setAlert({ type: 'error', msg: 'Lösenordet måste vara minst 6 tecken' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: 'error', msg: apiErrorMessage(data, 'Något gick fel') });
        return;
      }
      setAlert({ type: 'success', msg: 'Lösenordet har uppdaterats' });
      setCurrent(''); setNext(''); setConfirm('');
    } catch {
      setAlert({ type: 'error', msg: 'Nätverksfel. Försök igen.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Byta lösenord">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}
        <Field label="Nuvarande lösenord" type="password" value={current} onChange={setCurrent} placeholder="••••••••" />
        <Field label="Nytt lösenord" type="password" value={next} onChange={setNext} placeholder="••••••••" />
        <Field label="Bekräfta nytt lösenord" type="password" value={confirm} onChange={setConfirm} placeholder="••••••••" />
        <div><SaveButton loading={loading} label="Uppdatera lösenord" /></div>
      </form>
    </SectionCard>
  );
}

// ── Feature 2: Byta e-post ────────────────────────────────────────────────────

function ChangeEmail() {
  const { user, fetchMe } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/change-email`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_email: email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: 'error', msg: apiErrorMessage(data, 'Något gick fel') });
        return;
      }
      setAlert({ type: 'success', msg: 'E-postadressen har uppdaterats' });
      setEmail('');
      await fetchMe();
    } catch {
      setAlert({ type: 'error', msg: 'Nätverksfel. Försök igen.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Byta e-postadress">
      <p className="font-dm-mono text-xs mb-4" style={{ color: 'var(--dim)' }}>
        Nuvarande: <span style={{ color: 'var(--white)' }}>{user?.email}</span>
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}
        <Field label="Ny e-postadress" type="email" value={email} onChange={setEmail} placeholder="ny@exempel.se" />
        <div><SaveButton loading={loading} label="Uppdatera e-post" /></div>
      </form>
    </SectionCard>
  );
}

// ── Feature 3: Profilbild ─────────────────────────────────────────────────────

function ProfilePicture() {
  const { user, fetchMe } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [imgKey, setImgKey] = useState(0); // force re-render after upload

  const initials = user?.email ? user.email[0].toUpperCase() : '?';
  const hasPhoto = !!user?.profile_picture;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAlert(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API}/users/profile-picture`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: 'error', msg: data.detail ?? 'Uppladdning misslyckades' });
        return;
      }
      setAlert({ type: 'success', msg: 'Profilbilden har uppdaterats' });
      setImgKey((k) => k + 1);
      await fetchMe();
    } catch {
      setAlert({ type: 'error', msg: 'Nätverksfel. Försök igen.' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <SectionCard title="Profilbild">
      <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
      <div className="flex items-center gap-5">
        {/* Avatar circle */}
        <div
          className="w-16 h-16 flex items-center justify-center overflow-hidden shrink-0"
          style={{
            borderRadius: '50%',
            border: '1px solid var(--border)',
            background: hasPhoto ? 'transparent' : 'var(--steel)',
          }}
        >
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={imgKey}
              src={`${API}/users/me/profile-picture?t=${imgKey}`}
              alt="Profilbild"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-bebas text-2xl" style={{ color: 'var(--white)' }}>{initials}</span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="font-dm-mono text-xs uppercase tracking-wider px-4 py-2 transition-opacity disabled:opacity-50"
            style={{ background: 'var(--red)', color: 'var(--white)' }}
          >
            {uploading ? 'Laddar upp...' : '↑ Ladda upp bild'}
          </button>
          <p className="font-dm-mono text-[10px]" style={{ color: 'var(--dim)' }}>
            JPG eller PNG · Max 5 MB
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

// ── Feature 4: Radera konto ───────────────────────────────────────────────────

function DeleteAccount() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/users/me`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(apiErrorMessage(data, 'Något gick fel'));
        return;
      }
      router.push('/login');
    } catch {
      setError('Nätverksfel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SectionCard title="Radera konto">
        <p className="font-dm-mono text-xs mb-4" style={{ color: 'var(--dim)' }}>
          Detta raderar ditt konto, alla dina bilar och uppladdade dokument permanent.
        </p>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        <button
          onClick={() => setShowModal(true)}
          className="font-dm-mono text-xs uppercase tracking-wider px-5 py-2.5 transition-colors mt-2"
          style={{ border: '1px solid var(--red)', color: 'var(--red)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--red)';
            e.currentTarget.style.color = 'var(--white)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--red)';
          }}
        >
          Radera konto
        </button>
      </SectionCard>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => !loading && setShowModal(false)}
        >
          <div
            className="w-full max-w-md p-6 flex flex-col gap-4"
            style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-dm-sans text-base font-semibold" style={{ color: 'var(--white)' }}>
              Är du säker?
            </h3>
            <p className="font-dm-mono text-xs leading-relaxed" style={{ color: 'var(--dim)' }}>
              Detta går inte att ångra. Alla dina bilar och dokument kommer att raderas permanent.
            </p>
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 font-dm-mono text-xs uppercase tracking-wider py-2.5 transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--dim)' }}
              >
                Avbryt
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 font-dm-mono text-xs uppercase tracking-wider py-2.5 transition-opacity disabled:opacity-50"
                style={{ background: 'var(--red)', color: 'var(--white)' }}
              >
                {loading ? 'Raderar...' : 'Ja, radera mitt konto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Feature 5: Prenumerationsplan ─────────────────────────────────────────────

function SubscriptionPlan() {
  const { user } = useAuth();
  const [toast, setToast] = useState(false);
  const isPremium = user?.plan === 'premium';

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <SectionCard title="Prenumerationsplan">
      {toast && (
        <div
          className="font-dm-mono text-xs px-3 py-2 mb-4"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: '#22c55e' }}
        >
          Kommer snart — tack för ditt intresse!
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ background: 'var(--border)' }}>
        {/* Free plan */}
        <div
          className="p-5 flex flex-col gap-3"
          style={{
            background: 'var(--carbon)',
            outline: !isPremium ? '2px solid var(--red)' : 'none',
            outlineOffset: '-1px',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-dm-mono text-xs uppercase tracking-widest" style={{ color: 'var(--white)' }}>
              Gratis
            </span>
            {!isPremium && (
              <span
                className="font-dm-mono text-[9px] px-1.5 py-0.5 tracking-widest"
                style={{ background: 'var(--red)', color: 'var(--white)' }}
              >
                Aktiv
              </span>
            )}
          </div>
          <p className="font-bebas text-2xl tracking-widest" style={{ color: 'var(--white)' }}>0 kr/mån</p>
          <ul className="flex flex-col gap-1.5">
            {['Upp till 2 bilar', '100 MB dokumentlagring', 'AI-chat (begränsad)'].map((f) => (
              <li key={f} className="font-dm-mono text-[10px] flex items-center gap-2" style={{ color: 'var(--dim)' }}>
                <span style={{ color: 'var(--red)' }}>—</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium plan */}
        <div
          className="p-5 flex flex-col gap-3"
          style={{
            background: 'var(--carbon)',
            outline: isPremium ? '2px solid var(--red)' : 'none',
            outlineOffset: '-1px',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-dm-mono text-xs uppercase tracking-widest" style={{ color: 'var(--white)' }}>
              Premium
            </span>
            {isPremium && (
              <span
                className="font-dm-mono text-[9px] px-1.5 py-0.5 tracking-widest"
                style={{ background: 'var(--red)', color: 'var(--white)' }}
              >
                Aktiv
              </span>
            )}
          </div>
          <p className="font-bebas text-2xl tracking-widest" style={{ color: 'var(--white)' }}>49 kr/mån</p>
          <ul className="flex flex-col gap-1.5">
            {[
              'Obegränsat antal bilar',
              '10 GB dokumentlagring',
              'Obegränsad AI-chat',
              'Prioriterad support',
            ].map((f) => (
              <li key={f} className="font-dm-mono text-[10px] flex items-center gap-2" style={{ color: 'var(--dim)' }}>
                <span style={{ color: 'var(--red)' }}>—</span> {f}
              </li>
            ))}
          </ul>
          {!isPremium && (
            <button
              onClick={showToast}
              className="font-dm-mono text-xs uppercase tracking-wider px-4 py-2 mt-auto transition-colors"
              style={{ border: '1px solid var(--red)', color: 'var(--red)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--red)';
                e.currentTarget.style.color = 'var(--white)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--red)';
              }}
            >
              Uppgradera
            </button>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div style={{ background: 'var(--black)' }} className="min-h-screen flex flex-col">
        <DashboardHeader />

        <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="font-bebas text-3xl tracking-widest" style={{ color: 'var(--white)' }}>
              Inställningar
            </h1>
            <p className="font-dm-mono text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--dim)' }}>
              Hantera ditt konto och prenumeration
            </p>
          </div>

          <div className="flex flex-col gap-px" style={{ background: 'var(--border)' }}>
            <ProfilePicture />
            <ChangeEmail />
            <ChangePassword />
            <SubscriptionPlan />
            <DeleteAccount />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
