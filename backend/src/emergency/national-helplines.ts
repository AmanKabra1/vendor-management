import { EmergencyType } from './emergency.entity';

/**
 * Government helplines that work from any phone, anywhere in India — including
 * villages with no local listing yet. These are shipped as constants (not seeded
 * rows) so the emergency screen is never empty, even on a fresh database or
 * while offline with a cached response.
 *
 * Source: national emergency numbers published by the Government of India.
 */
export interface Helpline {
  type: EmergencyType;
  name: string;
  nameLocal: string;
  phone: string;
  notes: string;
}

export const NATIONAL_HELPLINES: Helpline[] = [
  {
    type: EmergencyType.Other,
    name: 'Emergency (all services)',
    nameLocal: 'आपातकालीन नंबर',
    phone: '112',
    notes:
      'Single number for police, fire and ambulance. Works without network balance.',
  },
  {
    type: EmergencyType.Ambulance,
    name: 'Ambulance',
    nameLocal: 'एम्बुलेंस',
    phone: '108',
    notes: 'Free 24x7 emergency ambulance in most states.',
  },
  {
    type: EmergencyType.FireBrigade,
    name: 'Fire brigade',
    nameLocal: 'दमकल (फायर ब्रिगेड)',
    phone: '101',
    notes: 'Fire, building collapse and rescue.',
  },
  {
    type: EmergencyType.Police,
    name: 'Police',
    nameLocal: 'पुलिस',
    phone: '100',
    notes: 'Also reachable on 112.',
  },
  {
    type: EmergencyType.Hospital,
    name: 'Medical helpline',
    nameLocal: 'स्वास्थ्य हेल्पलाइन',
    phone: '104',
    notes: 'Health advice, doctor on call, blood availability.',
  },
  {
    type: EmergencyType.GasLeak,
    name: 'LPG gas leak emergency',
    nameLocal: 'गैस रिसाव आपातकाल',
    phone: '1906',
    notes: 'Smell gas? Shut the regulator, do not switch on lights, then call.',
  },
  {
    type: EmergencyType.Electricity,
    name: 'Electricity fault / live wire',
    nameLocal: 'बिजली शिकायत',
    phone: '1912',
    notes: 'Power cut, sparking pole or a fallen live wire.',
  },
  {
    type: EmergencyType.WomenHelpline,
    name: 'Women helpline',
    nameLocal: 'महिला हेल्पलाइन',
    phone: '1091',
    notes: 'Domestic violence and harassment — 24x7.',
  },
  {
    type: EmergencyType.ChildHelpline,
    name: 'Child helpline',
    nameLocal: 'चाइल्डलाइन',
    phone: '1098',
    notes: 'Children in distress, child labour, missing child.',
  },
  {
    type: EmergencyType.Disaster,
    name: 'Disaster management',
    nameLocal: 'आपदा प्रबंधन',
    phone: '1077',
    notes: 'Flood, storm and district-level disaster control room.',
  },
  {
    type: EmergencyType.Veterinary,
    name: 'Animal / cattle ambulance',
    nameLocal: 'पशु एम्बुलेंस',
    phone: '1962',
    notes: 'Mobile veterinary unit for cattle and pets.',
  },
  {
    type: EmergencyType.Other,
    name: 'Railway helpline',
    nameLocal: 'रेलवे हेल्पलाइन',
    phone: '139',
    notes: 'Medical help, security and complaints on trains.',
  },
  {
    type: EmergencyType.Other,
    name: 'Road accident / highway patrol',
    nameLocal: 'सड़क दुर्घटना',
    phone: '1073',
    notes: 'National highway accident and towing assistance.',
  },
  {
    type: EmergencyType.Other,
    name: 'Senior citizen helpline',
    nameLocal: 'वरिष्ठ नागरिक हेल्पलाइन',
    phone: '14567',
    notes: 'Elder abuse, pension and medical support.',
  },
];

/** Safety steps shown next to the call buttons, in both languages. */
export const SAFETY_TIPS: { key: string; en: string; hi: string }[] = [
  {
    key: 'gas',
    en: 'Gas smell: close the regulator, open doors and windows, do not touch any switch, then call 1906.',
    hi: 'गैस की गंध: रेगुलेटर बंद करें, दरवाज़े-खिड़की खोलें, कोई स्विच न दबाएँ, फिर 1906 पर कॉल करें।',
  },
  {
    key: 'fire',
    en: 'Fire: get everyone out first, cut the main power, call 101. Never throw water on an electrical or oil fire.',
    hi: 'आग: पहले सबको बाहर निकालें, मेन बिजली बंद करें, 101 पर कॉल करें। बिजली या तेल की आग पर पानी न डालें।',
  },
  {
    key: 'medical',
    en: 'Medical: call 108 and stay on the line — say the landmark, not the address. Keep the patient flat and awake.',
    hi: 'मेडिकल: 108 पर कॉल करें और लाइन पर रहें — पता नहीं, नज़दीकी लैंडमार्क बताएँ। मरीज़ को लिटाकर होश में रखें।',
  },
  {
    key: 'wire',
    en: 'Fallen live wire: keep 10 steps away, stop others, call 1912. Do not use a stick or water.',
    hi: 'गिरा बिजली का तार: 10 कदम दूर रहें, दूसरों को रोकें, 1912 पर कॉल करें। लकड़ी या पानी का उपयोग न करें।',
  },
];
