import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEmployee } from "@/server/application/get-employee";
import { fullName } from "@/server/domain/employee";
import styles from "./page.module.css";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  let employee;
  try {
    employee = await getEmployee(decodeURIComponent(id));
  } catch {
    return { title: "Employee directory" };
  }
  if (!employee) return { title: "Employee not found" };
  return {
    title: `${fullName(employee)} — Employee directory`,
    description: employee.Notes ?? employee.Title,
  };
}

export default async function EmployeePage({ params }: { params: Params }) {
  const { id } = await params;
  const employee = await getEmployee(decodeURIComponent(id));

  if (!employee) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <Link className={styles.back} href="/">
        ← Back to directory
      </Link>

      <div>
        <h1 className={styles.title}>{fullName(employee)}</h1>
        {employee.Title && <p className={styles.jobTitle}>{employee.Title}</p>}
      </div>

      {employee.Notes && (
        <section className={styles.section}>
          <p className={styles.sectionTitle}>Bio</p>
          <p className={styles.notes}>{employee.Notes}</p>
        </section>
      )}

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Details</p>
        <div className={styles.meta}>
          {employee.HomePhone && (
            <div>
              <span className={styles.metaLabel}>Phone</span>
              {employee.HomePhone}
            </div>
          )}
          {employee.HiredAt && (
            <div>
              <span className={styles.metaLabel}>Hired</span>
              {new Date(employee.HiredAt).toLocaleDateString()}
            </div>
          )}
          {employee.Address?.City && (
            <div>
              <span className={styles.metaLabel}>City</span>
              {employee.Address.City}
              {employee.Address.Country ? `, ${employee.Address.Country}` : ""}
            </div>
          )}
          {employee.Territories && employee.Territories.length > 0 && (
            <div>
              <span className={styles.metaLabel}>Territories</span>
              {employee.Territories.join(", ")}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
