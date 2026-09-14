import type { Employee } from "@/server/domain/employee";
import { employeeRepository } from "@/server/infrastructure/raven/employee-repository";

export async function searchEmployees(term: string): Promise<Employee[]> {
  const trimmed = term.trim();
  if (!trimmed) {
    return employeeRepository.findAll();
  }
  return employeeRepository.search(trimmed);
}
