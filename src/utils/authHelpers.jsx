import { students } from "../data/students";

export function findStudentByRoll(roll) {
  return students.find(
    (student) => student.roll.toLowerCase() === roll.trim().toLowerCase()
  );
}