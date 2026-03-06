'use client';
import { useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import CarCard from '@/components/CarCard';
import ChatWindow from '@/components/ChatWindow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCars, createCarByRegnr, createCarManual, removeCar } from '@/hooks/use-cars';
import { type Car } from '@/lib/api-client';
import ProtectedRoute from '@/components/ProtectedRoute';

type AddMode = 'regnr' | 'manual';

const emptyManual = { regnr: '', make: '', model: '', year: '', engine: '' };

export default function DashboardPage() {
  const { cars, isLoading, isError } = useCars();
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('regnr');
  const [regnr, setRegnr] = useState('');
  const [manual, setManual] = useState(emptyManual);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const handleSelectCar = (car: Car) => {
    setSelectedCar((prev) => (prev?.id === car.id ? null : car));
  };

  const handleDeleteCar = async (carId: number) => {
    await removeCar(carId);
    setSelectedCar((prev) => (prev?.id === carId ? null : prev));
  };

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
        regnr: manual.regnr.trim().toUpperCase(),
        make: manual.make.trim(),
        model: manual.model.trim(),
        year: Number(manual.year),
        engine: manual.engine.trim() || undefined,
      });
      handleClose();
    } catch (err: any) {
      setAddError(err?.message ?? 'Kunde inte lägga till bilen.');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <DashboardHeader />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Mina fordon</h2>
          <Button
            onClick={() => (showAddForm ? handleClose() : setShowAddForm(true))}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          >
            {showAddForm ? 'Avbryt' : '+ Lägg till bil'}
          </Button>
        </div>

        {/* Add car form */}
        {showAddForm && (
          <div className="mb-6 bg-gray-800 border border-gray-700 rounded-xl p-5">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-900 rounded-lg p-1 mb-5 w-fit">
              <button
                onClick={() => { setAddMode('regnr'); setAddError(''); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  addMode === 'regnr'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Via regnummer
              </button>
              <button
                onClick={() => { setAddMode('manual'); setAddError(''); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  addMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Manuellt
              </button>
            </div>

            {addError && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-md mb-4">
                {addError}
              </div>
            )}

            {/* Auto lookup by regnr */}
            {addMode === 'regnr' && (
              <>
                <p className="text-sm text-gray-400 mb-3">Vi hämtar bilens uppgifter automatiskt via registreringsnumret.</p>
                <form onSubmit={handleAddByRegnr} className="flex gap-3">
                  <Input
                    placeholder="Regnummer (t.ex. ABC123)"
                    value={regnr}
                    onChange={(e) => setRegnr(e.target.value.toUpperCase())}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 max-w-xs"
                  />
                  <Button type="submit" disabled={addLoading || !regnr.trim()} className="bg-blue-600 hover:bg-blue-500">
                    {addLoading ? 'Söker...' : 'Lägg till'}
                  </Button>
                </form>
              </>
            )}

            {/* Manual entry */}
            {addMode === 'manual' && (
              <>
                <p className="text-sm text-gray-400 mb-3">Fyll i bilens uppgifter själv.</p>
                <form onSubmit={handleAddManual} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Regnummer (t.ex. ABC123)"
                    value={manual.regnr}
                    onChange={(e) => setManual({ ...manual, regnr: e.target.value.toUpperCase() })}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  />
                  <Input
                    placeholder="Märke (t.ex. Volvo)"
                    value={manual.make}
                    onChange={(e) => setManual({ ...manual, make: e.target.value })}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  />
                  <Input
                    placeholder="Modell (t.ex. V70)"
                    value={manual.model}
                    onChange={(e) => setManual({ ...manual, model: e.target.value })}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  />
                  <Input
                    placeholder="Årsmodell (t.ex. 2018)"
                    type="number"
                    min="1900"
                    max="2099"
                    value={manual.year}
                    onChange={(e) => setManual({ ...manual, year: e.target.value })}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  />
                  <Input
                    placeholder="Motor (valfritt, t.ex. 2.0 TDI)"
                    value={manual.engine}
                    onChange={(e) => setManual({ ...manual, engine: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 sm:col-span-2"
                  />
                  <Button
                    type="submit"
                    disabled={addLoading}
                    className="sm:col-span-2 bg-blue-600 hover:bg-blue-500 font-semibold"
                  >
                    {addLoading ? 'Sparar...' : 'Spara fordon'}
                  </Button>
                </form>
              </>
            )}
          </div>
        )}

        {/* States */}
        {isLoading && <div className="text-gray-400 py-12 text-center">Laddar fordon...</div>}
        {isError && <div className="text-red-400 py-12 text-center">Kunde inte hämta fordon. Är du inloggad?</div>}
        {!isLoading && !isError && cars.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-5xl mb-4">🚗</p>
            <p className="text-lg font-medium text-gray-300">Inga fordon i garaget</p>
            <p className="text-sm mt-1">Klicka på "+ Lägg till bil" för att komma igång.</p>
          </div>
        )}

        {/* Car grid */}
        {cars.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                isSelected={selectedCar?.id === car.id}
                onSelect={handleSelectCar}
                onDelete={handleDeleteCar}
              />
            ))}
          </div>
        )}

        {/* Chat window */}
        {selectedCar && (
          <div className="mt-6">
            <ChatWindow car={selectedCar} />
          </div>
        )}
      </main>
    </div>
    </ProtectedRoute>
  );
}
