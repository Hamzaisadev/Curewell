import { UnifiedMedicineHubPage } from './UnifiedMedicineHubPage';

/**
 * Today's Medication Schedule Page.
 * Delegates to the Unified Medicine Hub with the 'schedule' tab as default,
 * ensuring backward compatibility with all route links and test suites.
 */
export function TodaySchedulePage() {
  return <UnifiedMedicineHubPage defaultTab="schedule" />;
}

export default TodaySchedulePage;
