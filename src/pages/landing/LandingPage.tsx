import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ClinicalBentoGrid } from './components/ClinicalBentoGrid';
import { ProblemVsSolutionSection } from './components/ProblemVsSolutionSection';
import { ShifaAiClinicalTerminal } from './components/ShifaAiClinicalTerminal';
import { ComparisonMatrixSection } from './components/ComparisonMatrixSection';
import { VitalsTelemetrySection } from './components/VitalsTelemetrySection';
import { PrivacyVaultSection } from './components/PrivacyVaultSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { FinalCtaSection } from './components/FinalCtaSection';
import { Footer } from './components/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden selection:bg-teal-100 selection:text-teal-900 font-sans">
      {/* 1. Header Navigation */}
      <Navbar />

      <main>
        {/* 2. Hero Section with Blueprint Canvas & Proof Metrics */}
        <HeroSection />

        {/* 3. The Clinical Bento Grid — Award-Grade Core Architecture */}
        <ClinicalBentoGrid />

        {/* 4. Problem vs Solution: Broken Paper Reality vs Curewell Standard */}
        <ProblemVsSolutionSection />

        {/* 5. Shifa AI Clinical Intelligence Co-Pilot Terminal */}
        <ShifaAiClinicalTerminal />

        {/* 6. Comparison Matrix: Generic AI vs Curewell + Shifa AI */}
        <ComparisonMatrixSection />

        {/* 7. Clinical Vitals Telemetry & Automatic Staging */}
        <VitalsTelemetrySection />

        {/* 8. Bank-Grade Security & Zero-Knowledge Privacy Vault */}
        <PrivacyVaultSection />

        {/* 9. Patient & Physician Testimonials */}
        <TestimonialsSection />

        {/* 10. Frequently Asked Questions Accordion */}
        <FaqSection />

        {/* 11. Final Conversion Call to Action */}
        <FinalCtaSection />
      </main>

      {/* 12. Clinical Disclaimer, Sitemap & Social Placeholders */}
      <Footer />
    </div>
  );
}
