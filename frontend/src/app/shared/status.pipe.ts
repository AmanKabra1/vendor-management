import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from './i18n.service';

/**
 * Localised labels for the status codes stored in the database. These are data,
 * not UI chrome, so they don't live in the main dictionary — but a customer in
 * a town should still read "पहुँच गया" instead of "DELIVERED". Unknown codes
 * fall back to a tidy Title Case of the raw value, so nothing ever breaks.
 */
const STATUS: Record<string, { en: string; hi: string }> = {
  // order lifecycle
  CREATED: { en: 'Placed', hi: 'ऑर्डर हुआ' },
  RIDER_ASSIGNED: { en: 'Rider assigned', hi: 'राइडर मिला' },
  PICKED_UP: { en: 'Picked up', hi: 'उठा लिया' },
  IN_TRANSIT: { en: 'On the way', hi: 'रास्ते में' },
  DELIVERED: { en: 'Delivered', hi: 'पहुँच गया' },
  CANCELLED: { en: 'Cancelled', hi: 'रद्द' },
  FAILED: { en: 'Failed', hi: 'असफल' },

  // shop / account approval
  PENDING: { en: 'Pending', hi: 'बाकी' },
  APPROVED: { en: 'Approved', hi: 'मंज़ूर' },
  REJECTED: { en: 'Rejected', hi: 'अस्वीकृत' },
  SUSPENDED: { en: 'Suspended', hi: 'निलंबित' },

  // rider availability
  AVAILABLE: { en: 'Available', hi: 'उपलब्ध' },
  OFFLINE: { en: 'Offline', hi: 'ऑफ़लाइन' },
  ON_BREAK: { en: 'On break', hi: 'ब्रेक पर' },
  ON_DELIVERY: { en: 'On delivery', hi: 'डिलीवरी पर' },

  // supply / purchase orders
  PLACED: { en: 'Placed', hi: 'दिया गया' },
  ACCEPTED: { en: 'Accepted', hi: 'स्वीकृत' },
  DISPATCHED: { en: 'Dispatched', hi: 'भेजा गया' },
  RECEIVED: { en: 'Received', hi: 'मिल गया' },
  ISSUED: { en: 'Issued', hi: 'जारी' },
  COMPLETED: { en: 'Completed', hi: 'पूरा' },
  ACKNOWLEDGED: { en: 'Acknowledged', hi: 'स्वीकारा' },

  // payment
  COD: { en: 'Cash', hi: 'नकद' },
  UDHAAR: { en: 'Udhaar', hi: 'उधार' },
  PREPAID: { en: 'Prepaid', hi: 'पहले भुगतान' },
  WALLET: { en: 'Wallet', hi: 'वॉलेट' },
  COLLECTED: { en: 'Paid', hi: 'भुगतान हुआ' },
  SETTLED: { en: 'Settled', hi: 'निपटा' },
};

function titleCase(s: string) {
  return String(s || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

@Pipe({ name: 'status', standalone: false, pure: false })
export class StatusPipe implements PipeTransform {
  constructor(private i18n: I18nService) {}

  transform(value: string | null | undefined): string {
    if (!value) return '';
    const row = STATUS[String(value).toUpperCase()];
    if (!row) return titleCase(value);
    return this.i18n.lang() === 'hi' ? row.hi : row.en;
  }
}
