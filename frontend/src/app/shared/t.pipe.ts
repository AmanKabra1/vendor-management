import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from './i18n.service';

/**
 * `{{ 'nav.shops' | t }}` — the whole UI in one pipe.
 *
 * Deliberately impure: the language toggle has to repaint every visible label
 * at once, and this app's templates are small enough that the extra change
 * detection costs nothing measurable.
 */
@Pipe({ name: 't', standalone: false, pure: false })
export class TranslatePipe implements PipeTransform {
  constructor(private i18n: I18nService) {}

  transform(key: string): string {
    return this.i18n.t(key);
  }
}
