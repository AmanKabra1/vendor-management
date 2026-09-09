import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type StoreDocument = HydratedDocument<Store>;

/**
 * Every kind of shop a small town / kasba actually has. Grouped by what people
 * come looking for — daily food, medical & emergency, home & utility, farm, services.
 * Legacy values (GROCERY, RESTAURANT, PHARMACY, GENERAL, OTHER) are kept so
 * existing documents keep validating.
 */
export enum StoreCategory {
  // --- daily food ---
  Kirana = 'KIRANA', // general provision / rashan shop
  Grocery = 'GROCERY', // legacy alias of kirana
  Vegetable = 'VEGETABLE', // sabzi
  Fruit = 'FRUIT',
  Dairy = 'DAIRY', // milk, curd, paneer
  Bakery = 'BAKERY',
  Sweets = 'SWEETS', // mithai & namkeen
  MeatFish = 'MEAT_FISH',
  Restaurant = 'RESTAURANT',
  Tiffin = 'TIFFIN', // mess / dabba service

  // --- medical & emergency ---
  Medical = 'MEDICAL', // chemist / dawa ki dukan
  Pharmacy = 'PHARMACY', // legacy alias of medical
  Clinic = 'CLINIC',
  PathLab = 'PATH_LAB',
  Ambulance = 'AMBULANCE',
  Veterinary = 'VETERINARY',
  FireSafety = 'FIRE_SAFETY', // extinguishers, refilling, fire NOC help

  // --- home & utility ---
  Water = 'WATER', // 20L cans, jars, tanker
  Gas = 'GAS', // LPG cylinder agency / refill
  Hardware = 'HARDWARE',
  Electrical = 'ELECTRICAL',
  Plumbing = 'PLUMBING',
  BuildingMaterial = 'BUILDING_MATERIAL', // cement, sariya, sand
  Furniture = 'FURNITURE',
  Utensils = 'UTENSILS',
  Fuel = 'FUEL', // petrol pump / diesel / kerosene

  // --- everyday needs ---
  Stationery = 'STATIONERY',
  Xerox = 'XEROX', // photocopy, Aadhaar & online form work
  Cosmetics = 'COSMETICS',
  Clothing = 'CLOTHING',
  Footwear = 'FOOTWEAR',
  Mobile = 'MOBILE', // recharge, sim, repair
  Electronics = 'ELECTRONICS',
  PoojaSamagri = 'POOJA_SAMAGRI',
  Toys = 'TOYS',

  // --- farm & village trade ---
  Agri = 'AGRI', // beej, khaad, dawa
  CattleFeed = 'CATTLE_FEED', // pashu aahar
  Poultry = 'POULTRY',
  GrainMill = 'GRAIN_MILL', // aata chakki

  // --- services ---
  Salon = 'SALON',
  Tailor = 'TAILOR',
  Laundry = 'LAUNDRY',
  Repair = 'REPAIR', // mechanic, electrician, appliance repair
  Courier = 'COURIER',
  Transport = 'TRANSPORT', // tempo, tractor, packers

  // --- fallback ---
  General = 'GENERAL',
  Other = 'OTHER',
}

/** Categories treated as essential — surfaced first and delivered even in bad weather. */
export const ESSENTIAL_CATEGORIES: StoreCategory[] = [
  StoreCategory.Kirana,
  StoreCategory.Grocery,
  StoreCategory.Vegetable,
  StoreCategory.Fruit,
  StoreCategory.Dairy,
  StoreCategory.Medical,
  StoreCategory.Pharmacy,
  StoreCategory.Water,
  StoreCategory.Gas,
];

/** Categories that also belong in the public emergency directory. */
export const EMERGENCY_CATEGORIES: StoreCategory[] = [
  StoreCategory.Medical,
  StoreCategory.Pharmacy,
  StoreCategory.Clinic,
  StoreCategory.Ambulance,
  StoreCategory.Veterinary,
  StoreCategory.FireSafety,
  StoreCategory.Water,
  StoreCategory.Gas,
  StoreCategory.Electrical,
  StoreCategory.Plumbing,
];

export enum StoreStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Suspended = 'SUSPENDED',
}

@Schema({ _id: false })
export class StoreAddress {
  @Prop({ default: '' })
  street: string;

  @Prop({ default: '' })
  city: string;

  @Prop({ default: '' })
  state: string;

  @Prop({ default: '' })
  pincode: string;

  // "Behind Hanuman mandir", "Bus stand ke saamne" — how addresses actually work
  // in a kasba, where street names and GPS pins are unreliable.
  @Prop({ default: '' })
  landmark: string;

  // Mohalla / ward / village name.
  @Prop({ default: '' })
  area: string;
}
const StoreAddressSchema = SchemaFactory.createForClass(StoreAddress);

// GeoJSON Point: coordinates are [longitude, latitude].
@Schema({ _id: false })
export class GeoPoint {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number], default: [0, 0] })
  coordinates: number[];
}
const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

@Schema({ _id: false })
export class StoreDocumentFile {
  @Prop({ default: '' })
  type: string;

  @Prop({ default: '' })
  url: string;

  @Prop({ default: false })
  verified: boolean;
}
const StoreDocumentFileSchema = SchemaFactory.createForClass(StoreDocumentFile);

@Schema({ _id: false })
export class OperatingHours {
  @Prop({ default: '09:00' })
  open: string;

  @Prop({ default: '21:00' })
  close: string;

  @Prop({ type: [String], default: [] })
  days: string[];
}
const OperatingHoursSchema = SchemaFactory.createForClass(OperatingHours);

/**
 * A shop's price board. Small shops have no inventory system, so instead of
 * per-SKU stock we let them publish a simple rate list customers can order from.
 */
@Schema({ _id: false })
export class PriceListItem {
  @Prop({ default: '' })
  name: string;

  // Local-language name so a customer can read "आटा" instead of "Atta".
  @Prop({ default: '' })
  nameLocal: string;

  @Prop({ default: 0 })
  price: number;

  // kg, gram, litre, packet, dozen, can, cylinder, bora, pav…
  @Prop({ default: 'unit' })
  unit: string;

  @Prop({ default: true })
  available: boolean;
}
const PriceListItemSchema = SchemaFactory.createForClass(PriceListItem);

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Store {
  @Prop({ required: true })
  name: string;

  // Shop name in the local script — what's actually painted on the shutter.
  @Prop({ default: '' })
  nameLocal: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  // Field sales agent who brought this shop onto the platform (commission credit).
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  onboardedBy: Types.ObjectId | null;

  @Prop({ default: '' })
  email: string;

  @Prop({ default: '' })
  phone: string;

  // Many shopkeepers take orders on WhatsApp — keep it as a first-class channel.
  @Prop({ default: '' })
  whatsapp: string;

  @Prop({ type: String, enum: StoreCategory, default: StoreCategory.General })
  category: StoreCategory;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: StoreAddressSchema, default: () => ({}) })
  address: StoreAddress;

  @Prop({ type: GeoPointSchema, default: () => ({}) })
  location: GeoPoint;

  @Prop({ type: OperatingHoursSchema, default: () => ({}) })
  operatingHours: OperatingHours;

  // Chemists, water suppliers and gas agencies that answer at night.
  @Prop({ default: false })
  is24x7: boolean;

  // Shutter switch — a shop can pause orders for the day without going offline.
  @Prop({ default: false })
  closedToday: boolean;

  @Prop({ default: true })
  homeDelivery: boolean;

  // Shop keeps a credit book (udhaar) for regulars.
  @Prop({ default: false })
  acceptsUdhaar: boolean;

  // Listed in the public emergency / 24x7 directory.
  @Prop({ default: false })
  emergencyService: boolean;

  @Prop({ default: '' })
  upiId: string;

  @Prop({ default: 5 })
  deliveryRadiusKm: number;

  @Prop({ default: 0 })
  minOrderValue: number;

  // Flat local delivery charge; 0 means "use the platform distance formula".
  @Prop({ default: 0 })
  deliveryChargeFlat: number;

  // Mohallas / villages / pincodes this shop delivers to.
  @Prop({ type: [String], default: [] })
  serviceAreas: string[];

  @Prop({ type: [PriceListItemSchema], default: [] })
  priceList: PriceListItem[];

  @Prop({ type: [StoreDocumentFileSchema], default: [] })
  documents: StoreDocumentFile[];

  @Prop({ type: String, enum: StoreStatus, default: StoreStatus.Pending })
  status: StoreStatus;

  @Prop({ default: '' })
  rejectionReason: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  ratingCount: number;

  @Prop({ default: 0 })
  totalOrders: number;
}

export const StoreSchema = SchemaFactory.createForClass(Store);

// Geospatial index powers GET /stores/nearby.
StoreSchema.index({ location: '2dsphere' });
// Directory lookups: "medical shops in 452001", "open kiranas in this area".
StoreSchema.index({ category: 1, status: 1, isActive: 1 });
StoreSchema.index({ 'address.pincode': 1 });
