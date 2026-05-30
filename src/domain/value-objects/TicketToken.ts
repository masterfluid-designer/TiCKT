/**
 * Value Object : Token de ticket
 * Format : EVT{year2}_{10 chars uppercase alphanumeric}
 * Exemple : EVT26_XK92A8M3NP
 *
 * Ce VO encapsule la règle de génération et la validation du format.
 * Pas de dépendance externe — nanoid est appelé côté infrastructure.
 */
export class TicketToken {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static fromString(value: string): TicketToken {
    if (!TicketToken.isValid(value)) {
      throw new Error(`Invalid ticket token format: ${value}`);
    }
    return new TicketToken(value);
  }

  /**
   * Crée un token à partir d'un ID aléatoire déjà généré (côté infra)
   */
  static create(randomPart: string): TicketToken {
    const year = new Date().getFullYear().toString().slice(-2);
    const token = `EVT${year}_${randomPart.toUpperCase().slice(0, 10)}`;
    return new TicketToken(token);
  }

  static isValid(value: string): boolean {
    return /^EVT\d{2}_[A-Z0-9]{10}$/.test(value);
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: TicketToken): boolean {
    return this._value === other._value;
  }
}
