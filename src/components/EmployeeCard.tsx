import Link from "next/link";
import type { Employee } from "@/server/domain/employee";
import { fullName } from "@/server/domain/employee";
import styles from "./EmployeeCard.module.css";

export function EmployeeCard({ employee }: { employee: Employee }) {
  return (
    <Link className={styles.card} href={`/employees/${encodeURIComponent(employee.Id)}`}>
      <p className={styles.name}>{fullName(employee)}</p>
      {employee.Title && <p className={styles.title}>{employee.Title}</p>}
      {employee.Notes && <p className={styles.notes}>{employee.Notes}</p>}
    </Link>
  );
}
