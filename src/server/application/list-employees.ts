import type { Employee } from "@/server/domain/employee";
import { employeeRepository } from "@/server/infrastructure/raven/employee-repository";

export async function listEmployees(): Promise<Employee[]> {
  return employeeRepository.findAll();
}
