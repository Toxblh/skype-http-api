/**
 * I don't think that all of the properties can be undefined at the same time. `first` is almost
 * always there. The one time I saw it missing, `nickname` was there.
 *
 * Examples:
 * - `{"first": "Skype", "company": "Skype"}`
 * - `{"first": "Bob", "nickname": "bob"}`
 * - `{"first": "John", "surname": "Doe", "nickname": "live:john"}`
 * - `{"nickname": "motiontwin"}`
 */
export interface Name {
  first?: string
  surname?: string
  nickname?: string
  company?: string
}
