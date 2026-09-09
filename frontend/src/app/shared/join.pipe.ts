import { Pipe, PipeTransform } from '@angular/core';

/**
 * Joins the parts of an address that actually exist.
 *
 * Small-town addresses are ragged — a shop may have a landmark and no street,
 * or a mohalla and no pincode. Naive interpolation leaves ", , 452001" on the
 * screen; this drops the blanks instead.
 */
@Pipe({ name: 'rfJoin', standalone: false })
export class JoinPipe implements PipeTransform {
  transform(parts: (string | null | undefined)[], sep = ' · '): string {
    return (parts || [])
      .map((p) => (p ?? '').toString().trim())
      .filter(Boolean)
      .join(sep);
  }
}
