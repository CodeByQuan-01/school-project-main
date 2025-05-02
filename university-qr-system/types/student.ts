import { Timestamp } from "firebase/firestore";

export interface Student {
  id: string;
  fullName: string;
  matricNumber: string;
  faculty: string;
  department: string;
  photoUrl: string;
  status: "Pending" | "Verified" | "Rejected";
  createdAt: Timestamp | null;
}
