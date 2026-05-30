import { TreatmentCategory, OfferStatus } from '../types/types';

// ─── Enums / Constant Lists ──────────────────────────────────────────────────

export const TREATMENT_CATEGORIES: TreatmentCategory[] = [
  'Cosmetic Dentistry',
  'Implant Dentistry',
  'Pediatric Dentistry',
  'General Dentistry',
  'Orthodontics',
  'Emergency Dentistry',
];

export const OFFER_STATUSES: OfferStatus[] = [
  'Accepted',
  'Sent',
  'Declined',
  'Pending',
];

export const BUDGET_RANGES = [
  'Under €500',
  '€500 – €1,000',
  '€1,000 – €2,500',
  '€2,500 – €5,000',
  'Over €5,000',
];

export const ROMANIAN_CITIES = [
  'Alba Iulia', 'Alexandria', 'Arad', 'Bacău', 'Baia Mare', 'Bârlad',
  'Bistrița', 'Blaj', 'Botoșani', 'Brad', 'Brăila', 'Brașov', 'București',
  'Buzău', 'Câmpia Turzii', 'Câmpina', 'Câmpulung', 'Câmpulung Moldovenesc',
  'Caracal', 'Călărași', 'Cluj-Napoca', 'Codlea', 'Constanța', 'Craiova',
  'Curtea de Argeș', 'Dej', 'Deva', 'Dorohoi', 'Drăgășani',
  'Drobeta-Turnu Severin', 'Fălticeni', 'Făgăraș', 'Fetești', 'Focșani',
  'Galați', 'Giurgiu', 'Hunedoara', 'Huși', 'Iași', 'Lugoj', 'Lupeni',
  'Mediaș', 'Medgidia', 'Miercurea Ciuc', 'Mioveni', 'Moreni', 'Motru',
  'Odorheiu Secuiesc', 'Oltenița', 'Onești', 'Orăștie', 'Oradea', 'Orșova',
  'Pașcani', 'Petroșani', 'Piatra Neamț', 'Pitești', 'Ploiești', 'Predeal',
  'Rădăuți', 'Râmnicu Sărat', 'Râmnicu Vâlcea', 'Reșița', 'Roman',
  'Roșiori de Vede', 'Satu Mare', 'Sebeș', 'Sfântu Gheorghe', 'Sibiu',
  'Sighișoara', 'Sinaia', 'Slatina', 'Slobozia', 'Suceava', 'Târgoviște',
  'Târgu Jiu', 'Târgu Mureș', 'Târgu Neamț', 'Tecuci', 'Timișoara',
  'Tulcea', 'Turda', 'Turnu Măgurele', 'Urziceni', 'Vaslui', 'Vulcan',
  'Zalău', 'Zărnești',
];

export const INSURANCE_PROVIDERS = [
  'None',
  'Allianz',
  'AXA',
  'Signal Iduna',
  'Generali',
  'UNIQA',
  'Omniasig',
  'Other',
];

