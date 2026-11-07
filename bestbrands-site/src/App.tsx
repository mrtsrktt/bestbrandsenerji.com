import React, { useState, useCallback } from 'react';
import { Header } from './components/Header/Header';
import { HeroVideo } from './components/Hero/HeroVideo';
import { Preloader } from './components/Preloader/Preloader';
import { KeyFigures } from './components/KeyFigures/KeyFigures';
import { ContactCta } from './components/ContactCta/ContactCta';
import { SmoothScroll } from './components/SmoothScroll/SmoothScroll';
import { Footer } from './components/Footer/Footer';
import { InvestorRelations } from './components/InvestorRelations/InvestorRelations';
import { StockTicker } from './components/StockTicker/StockTicker';
import { NetworkMap } from './components/NetworkMap/NetworkMap';

export const App: React.FC = () => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  return (
    <div className="site-wrapper">
      <SmoothScroll />
      <Preloader onReveal={handleReveal} />
      <Header />
      <main id="main-content">
        <HeroVideo readyToPlay={isRevealed} />
        <KeyFigures />
        <NetworkMap />
        <InvestorRelations />
        <StockTicker />
        <ContactCta />
      </main>
      <Footer />
    </div>
  );
};

export default App;
