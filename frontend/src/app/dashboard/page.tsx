'use client';
import { useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import CarCard from '@/components/CarCard';
import { useCars, createCarByRegnr, createCarManual } from '@/hooks/use-cars';
import ProtectedRoute from '@/components/ProtectedRoute';

type AddMode = 'regnr' | 'manual';
const emptyManual = { regnr: '', make: '', model: '', year: '', engine: '' };

export default function DashboardPage() {
  const { cars, isLoading, isError } = useCars();
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode]         = useState<AddMode>('regnr');
  const [regnr, setRegnr]             = useState('');
  const [manual, setManual]           = useState(emptyManual);
  const [addLoading, setAddLoading]   = useState(false);
  const [addError, setAddError]       = useState('');

  const handleClose = () => {
    setShowAddForm(false);
    setAddError('');
    setRegnr('');
    setManual(emptyManual);
  };

  const handleAddByRegnr = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      await createCarByRegnr(regnr.trim().toUpperCase());
      handleClose();
    } catch {
      setAddError('Kunde inte hitta bilen. Kontrollera registreringsnumret.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      await createCarManual({
        regnr:  manual.regnr.trim().toUpperCase(),
        make:   manual.make.trim(),
        model:  manual.model.trim(),
        year:   Number(manual.year),
        engine: manual.engine.trim() || undefined,
      });
      handleClose();
    } catch (err: any) {
      setAddError(err?.message ?? 'Kunde inte lägga till bilen.');
    } finally {
      setAddLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 text-sm transition-colors placeholder:text-[#444]";
  const inputStyle = {
    background:  'var(--steel)',
    border:      '1px solid var(--border)',
    color:       'var(--white)',
    outline:     'none',
  };

  return (
    <ProtectedRoute>
      <div style={{ background: 'var(--black)' }} className="min-h-screen text-foreground flex flex-col">
        <DashboardHeader />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bebas text-3xl tracking-widest" style={{ color: 'var(--white)' }}>
              Mitt garage
            </h2>
            <button
              onClick={() => (showAddForm ? handleClose() : setShowAddForm(true))}
              style={{ background: showAddForm ? 'transparent' : 'var(--red)', color: 'var(--white)', border: showAddForm ? '1px solid var(--border)' : 'none' }}
              className="font-dm-mono text-xs uppercase tracking-widest px-5 py-2.5 transition-all"
            >
              {showAddForm ? 'Avbryt' : '+ Lägg till bil'}
            </button>
          </div>

          {/* Add car form */}
          {showAddForm && (
            <div style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }} className="mb-6 p-5">

              {/* Tabs */}
              <div style={{ background: 'var(--black)', border: '1px solid var(--border)' }}
                className="inline-flex p-1 mb-5">
                {(['regnr', 'manual'] as AddMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setAddMode(mode); setAddError(''); }}
                    style={{
                      background: addMode === mode ? 'var(--red)' : 'transparent',
                      color:      addMode === mode ? 'var(--white)' : 'var(--dim)',
                    }}
                    className="font-dm-mono text-xs uppercase tracking-widest px-4 py-1.5 transition-colors"
                  >
                    {mode === 'regnr' ? 'Via regnummer' : 'Manuellt'}
                  </button>
                ))}
              </div>

              {addError && (
                <div style={{ background: 'rgba(224,48,48,0.1)', border: '1px solid var(--red)', color: 'var(--red)' }}
                  className="font-dm-mono text-xs px-3 py-2 mb-4">
                  {addError}
                </div>
              )}

              {addMode === 'regnr' && (
                <>
                  <p className="font-dm-mono text-xs tracking-wide mb-3" style={{ color: 'var(--dim)' }}>
                    Vi hämtar bilens uppgifter automatiskt via registreringsnumret.
                  </p>
                  <form onSubmit={handleAddByRegnr} className="flex gap-3">
                    <input
                      placeholder="Regnummer (t.ex. ABC123)"
                      value={regnr}
                      onChange={(e) => setRegnr(e.target.value.toUpperCase())}
                      required
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                      onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
                      className={inputCls + ' max-w-xs'}
                    />
                    <button
                      type="submit"
                      disabled={addLoading || !regnr.trim()}
                      style={{ background: 'var(--red)', color: 'var(--white)' }}
                      className="font-dm-mono text-xs uppercase tracking-widest px-5 py-2.5 disabled:opacity-50 transition-opacity"
                    >
                      {addLoading ? 'Söker...' : 'Lägg till'}
                    </button>
                  </form>
                </>
              )}

              {addMode === 'manual' && (
                <>
                  <p className="font-dm-mono text-xs tracking-wide mb-3" style={{ color: 'var(--dim)' }}>
                    Fyll i bilens uppgifter själv.
                  </p>
                  <form onSubmit={handleAddManual} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input placeholder="Regnummer (t.ex. ABC123)" value={manual.regnr}
                      onChange={(e) => setManual({ ...manual, regnr: e.target.value.toUpperCase() })}
                      required style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                      onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
                      className={inputCls} />
                    <input placeholder="Märke (t.ex. Volvo)" value={manual.make}
                      onChange={(e) => setManual({ ...manual, make: e.target.value })}
                      required style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                      onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
                      className={inputCls} />
                    <input placeholder="Modell (t.ex. V70)" value={manual.model}
                      onChange={(e) => setManual({ ...manual, model: e.target.value })}
                      required style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                      onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
                      className={inputCls} />
                    <input placeholder="Årsmodell (t.ex. 2018)" type="number" min="1900" max="2099"
                      value={manual.year}
                      onChange={(e) => setManual({ ...manual, year: e.target.value })}
                      required style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                      onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
                      className={inputCls} />
                    <input placeholder="Motor (valfritt, t.ex. 2.0 TDI)" value={manual.engine}
                      onChange={(e) => setManual({ ...manual, engine: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                      onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
                      className={inputCls + ' sm:col-span-2'} />
                    <button
                      type="submit"
                      disabled={addLoading}
                      style={{ background: 'var(--red)', color: 'var(--white)' }}
                      className="sm:col-span-2 font-dm-mono text-xs uppercase tracking-widest py-3 disabled:opacity-50 transition-opacity"
                    >
                      {addLoading ? 'Sparar...' : 'Spara fordon'}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* States */}
          {isLoading && (
            <div className="font-dm-mono text-xs uppercase tracking-widest py-12 text-center"
              style={{ color: 'var(--dim)' }}>
              Laddar fordon...
            </div>
          )}
          {isError && (
            <div className="font-dm-mono text-xs uppercase tracking-widest py-12 text-center"
              style={{ color: 'var(--red)' }}>
              Kunde inte hämta fordon. Är du inloggad?
            </div>
          )}
          {!isLoading && !isError && cars.length === 0 && (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🚗</p>
              <p className="font-bebas text-2xl tracking-widest mb-1" style={{ color: 'var(--white)' }}>
                Inga fordon i garaget
              </p>
              <p className="font-dm-mono text-xs tracking-wide" style={{ color: 'var(--dim)' }}>
                Klicka på "+ Lägg till bil" för att komma igång.
              </p>
            </div>
          )}

          {/* Car grid */}
          {cars.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
