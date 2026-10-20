import { UnifiedMedicineHubPage } from './UnifiedMedicineHubPage';

/**
 * Medicine Cabinet & Inventory Page.
 * Delegates to the Unified Medicine Hub with the 'cabinet' tab as default,
 * ensuring seamless backward compatibility with all existing links to `/medicines/cabinet`.
 */
export function MedicineCabinetPage() {
  return <UnifiedMedicineHubPage defaultTab="cabinet" />;
}

export default MedicineCabinetPage;
