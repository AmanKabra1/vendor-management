import { INestApplicationContext } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user/user.service';
import { Role } from './auth/role.enum';
import { EmergencyService } from './emergency/emergency.service';
import { EmergencyType } from './emergency/emergency.entity';

/**
 * Seeds a default admin account on first boot so there's always a way in.
 * Credentials can be overridden via ADMIN_EMAIL / ADMIN_PASSWORD env vars.
 */
export async function seedAdmin(app: INestApplicationContext) {
  const userService = app.get(UserService);

  const email = process.env.ADMIN_EMAIL || 'admin@vendor.com';
  const existing = await userService.findByEmail(email);
  if (existing) {
    await seedEmergencyContacts(app);
    return;
  }

  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(password, 10);
  await userService.create({
    email,
    password: hash,
    name: 'Administrator',
    role: Role.Admin,
    isVerified: true,
    isApproved: true,
    vendor: null,
  });

  console.log(`👤 Seeded admin account: ${email} / ${password}`);

  await seedEmergencyContacts(app);
}

/**
 * A starter set of district-level emergency numbers.
 *
 * The national helplines (108, 101, 1906…) are constants in the emergency
 * module and always present. These extra rows exist so a fresh deployment
 * already demonstrates the *local* half of the directory — an admin edits them
 * with their own district's real numbers. Idempotent: reruns add nothing.
 */
async function seedEmergencyContacts(app: INestApplicationContext) {
  let emergency: EmergencyService;
  try {
    emergency = app.get(EmergencyService);
  } catch {
    return; // module not loaded (e.g. a trimmed test app)
  }

  const rows = [
    {
      type: EmergencyType.Hospital,
      name: 'District Hospital — casualty',
      nameLocal: 'ज़िला अस्पताल — इमरजेंसी',
      phone: '108',
      notes: 'Government casualty ward, open 24x7. Free emergency treatment.',
      is24x7: true,
      verified: true,
    },
    {
      type: EmergencyType.Chemist24x7,
      name: '24-hour medical store (hospital gate)',
      nameLocal: '24 घंटे मेडिकल स्टोर',
      phone: '104',
      notes: 'Night medicine counter — replace with your local chemist number.',
      is24x7: true,
      verified: false,
    },
    {
      type: EmergencyType.BloodBank,
      name: 'Blood bank',
      nameLocal: 'ब्लड बैंक',
      phone: '104',
      notes: 'Ask for group availability before travelling.',
      is24x7: true,
      verified: false,
    },
    {
      type: EmergencyType.WaterTanker,
      name: 'Municipal water tanker',
      nameLocal: 'नगर पालिका पानी टैंकर',
      phone: '1916',
      notes: 'Tanker booking during a supply cut.',
      is24x7: false,
      verified: false,
    },
    {
      type: EmergencyType.Municipality,
      name: 'Municipality control room',
      nameLocal: 'नगर पालिका कंट्रोल रूम',
      phone: '1800111555',
      notes: 'Drain overflow, garbage, street light, stray cattle.',
      is24x7: false,
      verified: false,
    },
  ];

  const added = await emergency.seedContacts(rows as any);
  if (added) {
    console.log(`🚨 Seeded ${added} local emergency contacts`);
  }
}
