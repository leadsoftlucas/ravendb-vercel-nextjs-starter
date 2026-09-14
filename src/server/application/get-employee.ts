import type { Employee } from "@/server/domain/employee";
import { employeeRepository } from "@/server/infrastructure/raven/employee-repository";

export async function getEmployee(id: string): Promise<Employee | null> {
  return employeeRepository.findById(id);
}
