/**
 * Domain model for the "Employees" collection of RavenDB's built-in Northwind
 * sample dataset (Management Studio -> Settings -> Create Sample Data).
 *
 * This is a plain TypeScript shape, not a class: RavenDB documents are schema-less
 * JSON, so the type only documents what the app relies on — it is not enforced
 * server-side and extra fields on the stored document are simply ignored.
 */
export interface EmployeeAddress {
  Line1?: string;
  Line2?: string;
  City?: string;
  Region?: string;
  PostalCode?: string;
  Country?: string;
}

export interface Employee {
  Id: string;
  FirstName: string;
  LastName: string;
  Title?: string;
  Address?: EmployeeAddress;
  HomePhone?: string;
  Extension?: string;
  Notes?: string;
  ReportsTo?: string;
  Territories?: string[];
  HiredAt?: string;
  Birthday?: string;
}

export function fullName(employee: Pick<Employee, "FirstName" | "LastName">): string {
  return `${employee.FirstName} ${employee.LastName}`;
}
