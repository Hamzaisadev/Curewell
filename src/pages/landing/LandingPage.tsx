import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ClinicalProtocolMarquee } from './components/ClinicalProtocolMarquee';
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
        {/* 2. Hero Section with 3D Perspective Vault Stage & Proof Metrics */}
        <HeroSection />

        {/* 3. Clinical Protocol Infinite Marquee */}
        <ClinicalProtocolMarquee />

        {/* 4. The Clinical Bento Grid — Interactive Living Health Vault */}
        <ClinicalBentoGrid />

        {/* 5. Problem vs Solution: Broken Paper Reality vs Curewell Standard */}
        <ProblemVsSolutionSection />

        {/* 6. Shifa AI Clinical Intelligence Co-Pilot Terminal */}
        <ShifaAiClinicalTerminal />

        {/* 7. Comparison Matrix: Generic AI vs Curewell + Shifa AI */}
        <ComparisonMatrixSection />

        {/* 8. Interactive Clinical Vitals Telemetry Lab & Automatic Staging */}
        <VitalsTelemetrySection />

        {/* 9. Bank-Grade Security & Zero-Knowledge Privacy Vault */}
        <PrivacyVaultSection />

        {/* 10. Patient & Physician Testimonials */}
        <TestimonialsSection />

        {/* 11. Frequently Asked Questions Accordion */}
        <FaqSection />

        {/* 12. Final Conversion Call to Action */}
        <FinalCtaSection />
      </main>

      {/* 13. Clinical Disclaimer, Sitemap & Network Telemetry */}
      <Footer />
    </div>
  );
}
