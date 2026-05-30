/**
 * Classe de base pour toutes les entités du domaine.
 * Aucune dépendance externe — pure logique métier.
 */
export abstract class Entity<T> {
  protected readonly _id: string;
  protected props: T;

  constructor(props: T, id: string) {
    this._id = id;
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  /**
   * Égalité par identité (même id = même entité)
   */
  equals(other?: Entity<T>): boolean {
    if (!other) return false;
    if (!(other instanceof Entity)) return false;
    return this._id === other._id;
  }

  toJSON(): T & { id: string } {
    return { ...this.props, id: this._id };
  }
}
