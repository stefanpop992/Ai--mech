import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white">
      
      {/* 1. HERO SEKTION (Startskärmen) */}
      <main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden px-6">
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/30 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full"></div>
        </div>

        <div className="text-center z-10 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Din personliga <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              AI-Mekaniker
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Sluta gissa vad som är fel på bilen. Ladda upp felkoder, ställ frågor och få experthjälp direkt i mobilen eller datorn – dygnet runt.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/dashboard" 
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 flex items-center gap-2 text-lg"
            >
              <span>Logga in till garaget</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            
            <a href="#how-it-works" className="text-gray-300 hover:text-white font-semibold py-4 px-8 rounded-full transition-colors">
              Hur fungerar det?
            </a>
          </div>
        </div>
      </main>

      {/* 2. SÅ FUNGERAR DET */}
      <section id="how-it-works" className="py-24 bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Fixa bilen i tre enkla steg</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Du behöver inte vara en bilexpert för att använda vår plattform. Vår AI guidar dig hela vägen från felsökning till färdig reparation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Steg 1 */}
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="w-14 h-14 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center text-2xl mb-6">
                🚘
              </div>
              <h3 className="text-xl font-bold mb-3">1. Välj ditt fordon</h3>
              <p className="text-gray-400">Lägg till din bil i garaget med registreringsnummer. AI:n hämtar automatiskt exakt information om din motor och modell.</p>
            </div>

            {/* Steg 2 */}
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="w-14 h-14 bg-cyan-600/20 text-cyan-400 rounded-xl flex items-center justify-center text-2xl mb-6">
                💬
              </div>
              <h3 className="text-xl font-bold mb-3">2. Beskriv problemet</h3>
              <p className="text-gray-400">Chatta med din AI-mekaniker. Berätta om missljud, varningslampor eller ladda upp en bild på delen du undrar över.</p>
            </div>

            {/* Steg 3 */}
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="w-14 h-14 bg-green-600/20 text-green-400 rounded-xl flex items-center justify-center text-2xl mb-6">
                🛠️
              </div>
              <h3 className="text-xl font-bold mb-3">3. Fixa felet</h3>
              <p className="text-gray-400">Få en tydlig steg-för-steg-guide, lista på verktyg du behöver och se interaktiva 3D-modeller på hur du byter delen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIDFOT (Footer) */}
      <footer className="bg-gray-950 py-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>© 2026 Mitt AI-Garage. Byggt för framtidens mekaniker.</p>
      </footer>

    </div>
  );
}