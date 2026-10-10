import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ClinicalProtocolMarquee } from './components/ClinicalProtocolMarquee';
import { InteractiveStoryScroller } from './components/InteractiveStoryScroller';
import { SentinelInteractiveRadar } from './components/SentinelInteractiveRadar';
import { ProblemVsSolutionSection } from './components/ProblemVsSolutionSection';
import { ShifaAiClinicalTerminal } from './components/ShifaAiClinicalTerminal';
import { ComparisonMatrixSection } from './components/ComparisonMatrixSection';
import { VitalsTrajectoryLab } from './components/VitalsTrajectoryLab';
import { DoctorPerspectiveSection } from './components/DoctorPerspectiveSection';
import { PrivacyVaultSection } from './components/PrivacyVaultSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { FinalCtaSection } from './components/FinalCtaSection';
import { Footer } from './components/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden selection:bg-teal-100 selection:text-teal-900 font-sans">
      {/* 1. Header Navigation with Floating Glass Bar & Continuous Progress Bar */}
      <Navbar />

      <main>
        {/* 2. Act I: The Inciting Reality (Tactile Paper-to-Enclave Hero & Rolling Proof Metrics) */}
        <HeroSection />

        {/* 3. Clinical Protocol Infinite Marquee */}
        <ClinicalProtocolMarquee />

        {/* 4. The 4-Act Clinical Storyboard Scroller (Optical Intake, Sentinel Radar, Lab Velocity, Consultation Dossier) */}
        <InteractiveStoryScroller />

        {/* 5. Act III Interactive Drug Collision Sandbox (Sentinel Radar) */}
        <SentinelInteractiveRadar />

        {/* 6. Problem vs Solution: Broken Paper Reality vs Curewell Standard */}
        <ProblemVsSolutionSection />

        {/* 7. Shifa AI Clinical Intelligence Co-Pilot Terminal */}
        <ShifaAiClinicalTerminal />

        {/* 8. Comparison Matrix: Deterministic Grounding vs Generative Hallucinations */}
        <ComparisonMatrixSection />

        {/* 9. Interactive Vitals Trajectory Lab & AHA/ACC/ADA Telemetry Staging */}
        <VitalsTrajectoryLab />

        {/* 10. Act V: The Clinical Handshake (Patient Mobile View vs Doctor 30-Sec Brief) */}
        <DoctorPerspectiveSection />

        {/* 11. Act VI: Bank-Grade Sovereign Security & Zero-Knowledge Privacy Vault */}
        <PrivacyVaultSection />

        {/* 12. Patient, Caregiver & Specialist Physician Clinical Testimonials */}
        <TestimonialsSection />

        {/* 13. Frequently Asked Questions Accordion with Category Filters */}
        <FaqSection />

        {/* 14. Final Conversion Call to Action (Pristine Light Theme) */}
        <FinalCtaSection />
      </main>

      {/* 15. Clinical Disclaimer, Sitemap & Network Telemetry */}
      <Footer />
    </div>
  );
}
